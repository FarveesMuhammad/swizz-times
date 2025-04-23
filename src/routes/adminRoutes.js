import express from "express"
import {loginGet,login,logoutAdmin} from "../controllers/admin/admin_controllers.js"
import dashboardController from "../controllers/admin/dashboardController.js"
import productController from "../controllers/admin/productsController.js"
import usersController from "../controllers/admin/usersControllers.js"
import { verifyAdminSession, preventAuthAdminAccess} from "../middlewares/userAuth.js"
import categoryController from "../controllers/admin/categoryController.js"
import brandController from "../controllers/admin/brandController.js"
import orderController from "../controllers/admin/orderController.js"
import couponController from "../controllers/admin/couponController.js"
import adminWalletController from "../controllers/admin/adminWalletController.js"
import walletController from "../controllers/user/walletController.js"
// import multer from "multer"
// import storage from "../helpers/multer.js"
// const uploads = multer({storage:storage})

const router = express.Router()





router.get('/login',preventAuthAdminAccess,loginGet)
router.post('/login',login)
// router.get('/dashboard',verifyAdminSession,dashboardGet)
router.get('/logout',logoutAdmin)



router.get('/dashboard', verifyAdminSession, dashboardController.loadDashboard);
router.get('/dashboard/analytics', verifyAdminSession, dashboardController.getAnalyticsData);
router.get('/dashboard/top-performers', verifyAdminSession, dashboardController.getTopPerformers);
// router.get('/sales-report', verifyAdminSession, dashboardController.generateSalesReport);
router.get('/download/excel', verifyAdminSession, dashboardController.downloadExcelReport);
router.get('/download/pdf', verifyAdminSession, dashboardController.downloadPDFReport);
router.get("/pageerror", (req, res) => {
    res.status(500).render("admin/error", { message: "Something went wrong!" });
});






// ==========================cartegory==============================
router.get('/category',verifyAdminSession,categoryController.categoryGet)
router.get('/category/add-category',verifyAdminSession,categoryController.getAddCategoryPage)
router.post('/category/add-category',categoryController.addCategory)
router.patch("/category/block-unblock/:id", categoryController.toggleCategoryBlock);
router.put('/category/update/:id',categoryController.updateCategory)

// ============================users=================================
router.get('/users',verifyAdminSession,usersController.getUserPage)
router.post("/users/block-unblock",usersController.blockUnblockUser)

// ============================products=================================
router.get('/products',verifyAdminSession,productController.getAllProducts)
router.get('/products/addProducts',verifyAdminSession,productController.addProductsPage)
router.post('/products/addProducts',productController.saveProducts)
router.delete('/products/delete/:id',productController.deleteProduct)
router.put('/products/edit/:id',productController.updateProduct)
router.get('/products/edit/:id',verifyAdminSession,productController.loadEditProductPage)
router.patch("/products/block-unblock/:id", productController.toggleProductBlock);



// ============================Brands=================================

router.get('/brands',verifyAdminSession,brandController.getBrandPage)
router.get('/brands/add-brands',verifyAdminSession,brandController.getAddBrandPage)
router.post('/brands/add-brands',brandController.saveBrand)
router.post("/brands/block-unblock",brandController.blockUnblockBrand)
router.delete('/brands/delete/:id',brandController.deleteBrand)
router.put('/brands/update/:id',brandController.updateBrand)

// ============================Orders=================================

router.get('/orders',verifyAdminSession,orderController.loadOrderPage)
router.get('/order-details/:orderId',verifyAdminSession,orderController.orderDetailPage)
router.patch('/orders/update-order-status/:orderId',verifyAdminSession,orderController.updateStatus)
router.post('/orders/:orderId/approve-return', orderController.approveReturn);



router.get('/coupons',verifyAdminSession,couponController.loadCouponPage)
router.post("/coupons", couponController.createCoupon);
router.delete("/coupons/:id",couponController.deleteCoupon);
router.patch("/coupons/:id/status", couponController.toggleCouponStatus);
router.put("/coupons/:id", couponController.editCoupon);




router.get('/wallet',verifyAdminSession,adminWalletController.loadWalletPage)
router.get('/transaction-details/:transactionId',verifyAdminSession,adminWalletController.transactionDetailPage)
router.get('/orderDetails/:orderId',verifyAdminSession,adminWalletController.orderDetailsPage)





export default router