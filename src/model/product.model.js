import mongoose,{Schema} from "mongoose";

const productSchema = new mongoose.Schema({
    name:{
        type:String, 
        required: [true, 'product name is required'], 
        trim: true},
    referenceNumber:{
        type:String, 
        required: [true, 'reference number is required'], 
        trim: true},
    brand:{
        type:String, 
        required: [true, 'brand is required'], 
        trim: true},
    description:{
        type:String, 
        required: [true, 'description is required']},
    price:{
        type:Number, 
        required: [true, 'price is required']},
    image:{
        type:[String], 
        default:[]},
    category: {
        type: String,
        enum: ['Classic', 'Divers', "Men's", "Women's", 'Unisex'],
        required: [true, 'Category is required'],
        },
    stock:{
        type:Number, 
        required: true,
        min: [0,'Stock cannot be negative']},
      isFeatured: {
      type: Boolean,
      default: false,
    },
  specifications: {
    caseDiameter: String,
    caseThickness: String,
    material: String,
    movement: String,
    waterResistance: String,
    crystal: String,
    },
    conditionNote: {
        type: String,
        default: '',
    },
    discount: {
        type: Number,
        default: 0,
    },

},
 { timestamps: true })


 export default mongoose.model ('Product',productSchema)