import { Coupon } from "../../models/couponSchema.js";

const loadCouponPage = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.render("admin/coupon", { coupons });
    } catch (error) {
        console.error("Error loading coupon page:", error);
        res.status(500).send("Internal Server Error");
    }
};



const createCoupon = async (req, res) => {
    try {
        const { code, discount, expiryDate, minPurchaseAmount, maxDiscountAmount } = req.body;

        if (!code || !discount || !expiryDate || minPurchaseAmount === undefined || maxDiscountAmount === undefined) {
            return res.status(400).json({ error: "All fields are required" });
        }
 if (minPurchaseAmount < 0 || maxDiscountAmount < 0) {
            return res.status(400).json({ error: "Minimum purchase and maximum discount amounts must be positive numbers" });
        }

        if (discount < 1 || discount > 100) {
            return res.status(400).json({ error: "Discount must be between 1% and 100%" });
        }

        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ error: "Coupon code already exists" });
        }
        const newCoupon = new Coupon({ 
            code, 
            discount, 
            expiryDate, 
            minPurchaseAmount, 
            maxDiscountAmount 
        });

        await newCoupon.save();

        res.status(201).json({ success: true, message: "Coupon created successfully" });

    } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ error: "Server error, try again" });
    }
};


const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCoupon = await Coupon.findByIdAndDelete(id);
        if (!deletedCoupon) {
            return res.status(404).json({ error: "Coupon not found" });
        }
        res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error, try again" });
    }
};

const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ error: "Coupon not found" });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.json({ success: true, message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully` });
    } catch (error) {
        res.status(500).json({ error: "Server error, try again" });
    }
};

const editCoupon = async (req,res) =>{
    try {
        const { id } = req.params;
        const { code, discount, minPurchaseAmount, maxDiscountAmount, expiryDate } = req.body;
    
        await Coupon.findByIdAndUpdate(id, {
          code,
          discount,
          minPurchaseAmount,
          maxDiscountAmount,
          expiryDate
        });
    
        res.status(200).json({ message: 'Coupon updated successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update coupon' });
      }
}

export default {
    loadCouponPage,
    createCoupon,
    deleteCoupon,
    toggleCouponStatus,
    editCoupon
};