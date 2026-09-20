import Subscriber from '../model/subscriber.model.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc    Subscribe email
// @route   POST /api/subscribers
// @access  Public
export const subscribe = async (req, res) => {
  try {
    
   const { email, captchaToken } = req.body;

// Verify captcha
      const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      });
      const captchaResult = await verify.json();
      if (!captchaResult.success) {
        return res.status(400).json({ message: 'Captcha verification failed. Please try again.' });
      }

      if (!email) return res.status(400).json({ message: 'Email is required' });

      const existing = await Subscriber.findOne({ email });
      if (existing) {
        if (!existing.isActive) {
          existing.isActive = true;
          await existing.save();
          return res.json({ message: 'Welcome back! You are now resubscribed.' });
        }
        return res.status(400).json({ message: 'Email already subscribed' });
      }

      await Subscriber.create({ email });
    // Send welcome email
    await transporter.sendMail({
      from: `"Aeonix Timepieces" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Aeonix Timepieces!',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #f0ece4;">
          <h1 style="font-size: 24px; color: #C8A03C; letter-spacing: 4px; margin-bottom: 8px;">AEONIX</h1>
          <h2 style="font-size: 18px; color: #f0ece4; margin-bottom: 16px;">You're in the community!</h2>
          <p style="color: #999; font-size: 14px; line-height: 1.7;">
            Thank you for subscribing to Aeonix Timepieces. You'll be the first to know about our latest watch arrivals, exclusive deals, and special offers.
          </p>
          <div style="margin: 24px 0; border-top: 1px solid #C8A03C33;"></div>
          <a href="${process.env.CLIENT_URL}" style="display: inline-block; padding: 12px 32px; background: #C8A03C; color: #0a0a0a; text-decoration: none; font-weight: 700; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Shop Now</a>
          <p style="color: #555; font-size: 11px; margin-top: 24px;">You can unsubscribe at any time by replying to this email.</p>
        </div>
      `,
    });

    res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all subscribers
// @route   GET /api/subscribers
// @access  Admin
export const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete subscriber
// @route   DELETE /api/subscribers/:id
// @access  Admin
export const deleteSubscriber = async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subscriber removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Send new stock email to all subscribers
// @route   POST /api/subscribers/notify
// @access  Admin
export const notifyNewStock = async (req, res) => {
  try {
    const { subject, message, watches } = req.body;
    const subscribers = await Subscriber.find({ isActive: true });

    if (subscribers.length === 0) {
      return res.status(400).json({ message: 'No active subscribers' });
    }

    const watchList = watches?.length > 0
      ? `<div style="margin: 20px 0;">
          ${watches.map(w => `
            <div style="display: flex; gap: 12px; padding: 12px; background: #111; margin-bottom: 8px;">
              ${w.image ? `<img src="${w.image}" style="width: 60px; height: 60px; object-fit: cover;" />` : ''}
              <div>
                <p style="color: #C8A03C; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">${w.brand}</p>
                <p style="color: #f0ece4; font-size: 14px; font-weight: bold; margin: 4px 0;">${w.name}</p>
                <p style="color: #C8A03C; font-size: 13px; margin: 0;">₱${Number(w.price).toLocaleString()}</p>
              </div>
            </div>
          `).join('')}
        </div>`
      : '';

    const emails = subscribers.map(s => s.email);

    await transporter.sendMail({
      from: `"Aeonix Timepieces" <${process.env.EMAIL_USER}>`,
      bcc: emails,
      subject: subject || 'New Watches Just Arrived at Aeonix!',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #f0ece4;">
          <h1 style="font-size: 24px; color: #C8A03C; letter-spacing: 4px; margin-bottom: 8px;">AEONIX</h1>
          <h2 style="font-size: 18px; color: #f0ece4; margin-bottom: 12px;">${subject || 'New Stock Alert!'}</h2>
          <p style="color: #999; font-size: 14px; line-height: 1.7;">${message || 'We have exciting new timepieces in stock. Check them out before they\'re gone!'}</p>
          ${watchList}
          <div style="margin: 24px 0; border-top: 1px solid #C8A03C33;"></div>
          <a href="${process.env.CLIENT_URL}/allwatches" style="display: inline-block; padding: 12px 32px; background: #C8A03C; color: #0a0a0a; text-decoration: none; font-weight: 700; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">View New Arrivals</a>
          <p style="color: #555; font-size: 11px; margin-top: 24px;">You received this because you subscribed to Aeonix Timepieces updates.</p>
        </div>
      `,
    });

    res.json({ message: `Email sent to ${subscribers.length} subscribers!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
