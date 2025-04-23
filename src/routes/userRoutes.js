import express from "express"
import usersControllers from "../controllers/user/userController.js"
import { verifyUserToken } from "../middlewares/userAuth.js"
import userProfileController from "../controllers/user/userProfileController.js"
import cartController from "../controllers/user/cartController.js"
import checkOutController from "../controllers/user/checkOutController.js"
import orderController from "../controllers/user/orderController.js"
import wishlistController from "../controllers/user/wishlistController.js"
import paymentController from "../controllers/user/paymentController.js"
import walletController from "../controllers/user/walletController.js"
const router = express.Router()


router.get('/',verifyUserToken,usersControllers.homeGet)
router.get('/shop',verifyUserToken,usersControllers.shopGet)
router.get('/shop/product/:id',verifyUserToken,usersControllers.productDetailPage)
router.post("/shop/product/review/:id",usersControllers.reviewAdd)



router.get("/userDetails",verifyUserToken,userProfileController.userDetailsGet)
router.get("/editUser",verifyUserToken,userProfileController.editUserDetailsPage)
router.post("/editUser",verifyUserToken,userProfileController.editUserDetails)
router.get("/editUser/verify-otp",userProfileController.verifyOtpPage)
router.post("/editUser/verify-otp",userProfileController.verifyOtp)
router.post("/editUser/resend-otp",userProfileController.emailResendOtp)
router.post("/editUser/change-password",userProfileController.changePassword)



router.get("/user-addresses",verifyUserToken,userProfileController.showUserAddresses)
router.post("/user-addresses",verifyUserToken,userProfileController.addAddress)
router.delete("/user-addresses/:addressId", verifyUserToken,userProfileController.removeAddress);
router.patch("/user-addresses/default/:addressId", verifyUserToken,userProfileController.setDefaultAddress);
router.put("/user-addresses/edit/:addressId", verifyUserToken,userProfileController.updateAddress);




router.get("/cart",verifyUserToken,cartController.loadCart)
router.post("/cart", verifyUserToken, cartController.addToCart);
router.patch("/cart/update", verifyUserToken,cartController.updateCart);
router.delete("/cart/remove/:productId", verifyUserToken, cartController.removeFromCart);



router.get('/checkout',verifyUserToken,checkOutController.getCheckOutPage)
router.get("/checkout/user-addresses/:addressId", verifyUserToken, checkOutController.getAddress);
router.get('/order-success/:orderId',verifyUserToken,checkOutController.orderSuccessPage)
router.post('/checkout/place-order',verifyUserToken,checkOutController.placeOrder)
router.post('/checkout/wallet-placeOrder',verifyUserToken,checkOutController.placeOrder)
router.post('/coupon/apply',verifyUserToken,checkOutController.applyCoupon)
router.post('/coupon/remove',verifyUserToken,checkOutController.removeCoupon)


router.get('/order-details/:orderId',verifyUserToken,orderController.orderDetailsPage)
router.get('/order',verifyUserToken,orderController.loadOrderPage)
router.post('/order/cancel-order/:orderId',verifyUserToken,orderController.cancelOrder)
router.post('/order/cancel-product/:orderId/:productId',verifyUserToken,orderController.cancelProduct)
router.post('/order/return-order/:orderId',verifyUserToken,orderController.returnOrder)
router.get('/order-details/download-invoice/:orderId',verifyUserToken,orderController.downloadInvoice)

router.post("/create-order",verifyUserToken,paymentController.createRazorpayOrder);
router.post("/verify-payment",verifyUserToken,paymentController.verifyRazorpayPayment);
router.post('/retry-payment/:orderId',paymentController.retryPayment);
router.post('/handle-payment-failure',verifyUserToken, paymentController.handlePaymentFailure);
router.post("/retry-verify-payment",verifyUserToken,paymentController.retryVerifyRazorpayPayment);
router.get(
  '/transaction-failure', verifyUserToken,
  paymentController.loadTransactionFailurePage
)



router.get('/wishlist',verifyUserToken,wishlistController.loadWishlist)
router.post('/add-to-wishlist',verifyUserToken,wishlistController.addToWishlist)
router.delete("/remove-from-wishlist/:productId", verifyUserToken,wishlistController.removeFromWishlist)



router.get('/wallet',verifyUserToken,walletController.loadWallet)





export default router