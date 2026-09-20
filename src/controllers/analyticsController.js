import Order from '../model/order.model.js';
import Product from '../model/product.model.js';

// @desc    Get monthly performance (revenue, profit, orders)
// @route   GET /api/analytics/monthly
// @access  Admin
export const getMonthlyPerformance = async (req, res) => {
  try {
    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();

    // Aggregate orders by month for the given year
    const monthlyData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31T23:59:59`),
          },
          status: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          items: { $push: '$items' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate profit per month using costPrice from products
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleString('en-PH', { month: 'short' }),
      revenue: 0,
      profit: 0,
      orders: 0,
    }));

    for (const m of monthlyData) {
      const idx = m._id - 1;
      months[idx].revenue = m.revenue;
      months[idx].orders = m.orders;

      // Calculate cost of goods sold
      let totalCost = 0;
      for (const itemGroup of m.items) {
        for (const item of itemGroup) {
          const product = await Product.findById(item.product).select('costPrice');
          const cost = product?.costPrice || 0;
          totalCost += cost * item.quantity;
        }
      }
      months[idx].profit = m.revenue - totalCost;
    }

    // Current month summary
    const currentMonth = now.getMonth();
    const currentSummary = months[currentMonth];

    res.json({ months, currentSummary, year });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get inventory summary with margins
// @route   GET /api/analytics/inventory
// @access  Admin
export const getInventorySummary = async (req, res) => {
  try {
    const products = await Product.find().select(
      'name brand price costPrice stock condition category image'
    );

    const inventory = products.map(p => {
      const cost = p.costPrice || 0;
      const margin = p.price > 0 ? ((p.price - cost) / p.price * 100).toFixed(1) : 0;
      const profit = p.price - cost;
      const totalInventoryValue = p.stock * p.price;
      const totalCostValue = p.stock * cost;

      return {
        _id: p._id,
        name: p.name,
        brand: p.brand,
        image: p.image?.[0]?.replace(/"/g, '') || '',
        condition: p.condition,
        category: p.category,
        stock: p.stock,
        costPrice: cost,
        sellingPrice: p.price,
        profit,
        margin: Number(margin),
        totalInventoryValue,
        totalCostValue,
      };
    });

    const totalInventoryValue = inventory.reduce((s, p) => s + p.totalInventoryValue, 0);
    const totalCostValue = inventory.reduce((s, p) => s + p.totalCostValue, 0);
    const totalPotentialProfit = totalInventoryValue - totalCostValue;

    res.json({ inventory, totalInventoryValue, totalCostValue, totalPotentialProfit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get best selling products by category
// @route   GET /api/analytics/best-by-category
// @access  Admin
export const getBestByCategory = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'Cancelled' } })
      .populate('items.product', 'name images category brand');

    // Build category → products map
    const categoryMap = {};

    for (const order of orders) {
      for (const item of order.items) {
        const category = item.product?.category || 'Unknown';
        const id = item.product?._id?.toString();
        if (!id) continue;

        if (!categoryMap[category]) categoryMap[category] = {};
        if (!categoryMap[category][id]) {
          categoryMap[category][id] = {
            _id: id,
            name: item.name || item.product?.name,
            image: (item.image || item.product?.images?.[0] || '').replace(/"/g, ''),
            brand: item.product?.brand || '',
            category,
            count: 0,
          };
        }
        categoryMap[category][id].count += item.quantity;
      }
    }

    // Sort each category by count, keep top 3
    const result = Object.entries(categoryMap).map(([category, products]) => ({
      category,
      topProducts: Object.values(products)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
      totalSold: Object.values(products).reduce((s, p) => s + p.count, 0),
    })).sort((a, b) => b.totalSold - a.totalSold);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get sales by channel
// @route   GET /api/analytics/channels
// @access  Admin
export const getSalesByChannel = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'Cancelled' } });

    const channelMap = {};
    let total = 0;

    for (const order of orders) {
      const channel = order.channel || 'Website';
      if (!channelMap[channel]) channelMap[channel] = { count: 0, revenue: 0 };
      channelMap[channel].count += 1;
      channelMap[channel].revenue += order.totalAmount;
      total += 1;
    }

    const result = Object.entries(channelMap)
      .map(([channel, data]) => ({
        channel,
        count: data.count,
        revenue: data.revenue,
        percentage: total > 0 ? Number((data.count / total * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    res.json({ channels: result, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};