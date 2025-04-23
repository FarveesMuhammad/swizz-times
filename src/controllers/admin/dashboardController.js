import { Order } from "../../models/orderSchema.js";
import { Product } from "../../models/productSchema.js"; 
import { User } from "../../models/userSchema.js";
import { Coupon } from "../../models/couponSchema.js";
import { Category } from "../../models/categorySchema.js"; 
import { Brand } from "../../models/brandSchema.js"; 
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import "pdfkit-table"; 
import table from "pdfkit-table"
import createDateFilter from "../../utils/dateFilter.js"
import { format } from "date-fns"; 



// import PDFDocument from "pdfkit";
// import pdfTable from "pdfkit-table";

// // Extend PDFDocument with table functionality
// pdfTable(PDFDocument);







const getBestSellingProducts = async (dateFilter) => {
  return await Order.aggregate([
    { $match: dateFilter },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    {
      $project: {
        name: { $arrayElemAt: ["$productInfo.productName", 0] },
        unitsSold: 1,
        revenue: 1,
      },
    },
  ]);
};

const getBestCategories = async (dateFilter) => {
  return await Order.aggregate([
    { $match: dateFilter }, 
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "productInfo.category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    {
      $group: {
        _id: { $arrayElemAt: ["$categoryInfo._id", 0] },
        name: { $first: { $arrayElemAt: ["$categoryInfo.name", 0] } },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);
};

const getSalesData = async (dateFilter) => {
  return await Order.aggregate([
    { $match: dateFilter },
    { $unwind: "$items" },
    {
      $project: {
        createdAt: 1,
        itemRevenue: { $multiply: ["$items.price", "$items.quantity"] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$itemRevenue" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { "_id": 1 } },
    { $project: { date: "$_id", revenue: 1, orderCount: 1, _id: 0 } },
  ]);
};



const loadDashboard = async (req, res) => {
  try {
    const { page = 1, filter = "daily", startDate, endDate } = req.query;
    const limit = 6;

    // console.log("Query:", req.query);
    // console.log("Filter:", filter, "StartDate:", startDate, "EndDate:", endDate);

    if (filter === "custom") {
      if (!startDate || !endDate) throw new Error("Start date and end date are required for custom filter.");
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error("Invalid date format.");
      if (end < start) throw new Error("End date cannot be before start date.");
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (start > today || end > today) throw new Error("Dates cannot be in the future.");
    }

    const dateFilter = createDateFilter(filter, startDate, endDate);
    // console.log("Date Filter:", dateFilter);

    const [
      totalOrders,
      salesSummary,
      orders,
      totalUsers,
      totalProducts,
      totalCoupons,
      bestSellingProducts,
      bestCategories,
      salesData,
    ] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            totalDiscount: { $sum: { $add: ["$discount", "$couponDiscount"] } },
            totalProductsSold: { $sum: { $sum: "$items.quantity" } },
          },
        },
      ]),
      Order.find(dateFilter)
        .populate("items.product", "productName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(),
      Product.countDocuments(),
      Coupon.countDocuments(),
      getBestSellingProducts(dateFilter),
      getBestCategories(dateFilter),
      getSalesData(dateFilter),
    ]);

    const responseData = {
      totalOrders,
      totalSales: salesSummary[0]?.totalSales || 0,
      totalDiscount: salesSummary[0]?.totalDiscount || 0,
      totalProductsSold: salesSummary[0]?.totalProductsSold || 0,
      orders,
      totalUsers,
      totalProducts,
      totalCoupons,
      bestSellingProducts,
      bestCategories,
      salesData,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: parseInt(page),
      selectedFilter: filter,
      startDate: startDate || "",
      endDate: endDate || "",
    };

    console.log("Response Data===============", {
      totalSales: responseData.totalSales,
      totalOrders: responseData.totalOrders,
      salesData: responseData.salesData,
    }); 

    res.render("admin/dashboard", responseData);
  } catch (error) {
    console.error("Error loading Swizz-Times dashboard:", error.message);
    res.render("admin/dashboard", {
      totalOrders: 0,
      totalSales: 0,
      totalDiscount: 0,
      totalProductsSold: 0,
      orders: [],
      totalUsers: 0,
      totalProducts: 0,
      totalCoupons: 0,
      bestSellingProducts: [],
      bestCategories: [],
      salesData: [],
      totalPages: 0,
      currentPage: parseInt(page),
      selectedFilter: filter || "daily",
      startDate: startDate || "",
      endDate: endDate || "",
      errorMessage: error.message,
    });
  }
};

const getAnalyticsData = async (req, res) => {
  try {
    const { filter = "daily", startDate, endDate } = req.query;
    const dateFilter = createDateFilter(filter, startDate, endDate);

    const [bestSellingProducts, bestCategories, salesData] = await Promise.all([
      getBestSellingProducts(dateFilter),
      getBestCategories(dateFilter),
      getSalesData(dateFilter, filter),
    ]);

    res.json({ bestSellingProducts, bestCategories, salesData });
  } catch (error) {
    console.error("Error fetching Swizz-Times analytics:", error);
    res.status(500).json({ error: error.message });
  }
};


const getTopPerformers = async (req, res) => {
  try {
    const { filter = "daily", startDate, endDate } = req.query;
    const dateFilter = createDateFilter(filter, startDate, endDate);

    const [products, categories] = await Promise.all([
      getBestSellingProducts(dateFilter),
      getBestCategories(dateFilter),
    ]);

    res.json({ products, categories });
  } catch (error) {
    console.error("Error fetching Swizz-Times top performers:", error);
    res.status(500).json({ error: error.message });
  }
};


const downloadExcelReport = async (req, res) => {
  try {
    const { filter = "daily", startDate, endDate } = req.query;
    const dateFilter = createDateFilter(filter, startDate, endDate);
    const queryFilter = { ...dateFilter }; 

    console.log("Excel Query Filter:", queryFilter);

    const orders = await Order.find(queryFilter).populate("items.product");
    console.log("Excel Report Orders:", orders.length, orders.map(o => ({ orderId: o.orderId, createdAt: o.createdAt, orderStatus: o.orderStatus })));

    const summary = await Order.aggregate([
      { $match: queryFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalDiscount: { $sum: { $add: ["$discount", "$couponDiscount"] } },
        },
      },
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Swizz-Times Sales Report");

    worksheet.addRow(["Swizz-Times Sales Report"]);
    worksheet.addRow(["Filter:", filter]);
    worksheet.addRow([
      "Date Range:",
      `${format(dateFilter.createdAt.$gte, "yyyy-MM-dd")} to ${format(dateFilter.createdAt.$lte, "yyyy-MM-dd")}`,
    ]);
    worksheet.addRow([]);

    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Product", key: "product", width: 25 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Price", key: "price", width: 12 },
      { header: "Discount", key: "discount", width: 12 },
      { header: "Total Amount", key: "totalAmount", width: 12 },
      { header: "Status", key: "status", width: 12 },
    ];

    if (orders.length === 0) {
      worksheet.addRow(["No orders found for the selected date range."]);
    } else {
      orders.forEach((order) => {
        order.items.forEach((item) => {
          worksheet.addRow({
            orderId: order.orderId,
            date: format(order.createdAt, "yyyy-MM-dd"),
            product: item.product?.productName || "N/A",
            quantity: item.quantity || 0,
            price: item.price || 0,
            discount: (order.discount + order.couponDiscount).toFixed(2),
            totalAmount: order.totalAmount.toFixed(2),
            status: order.orderStatus,
          });
        });
      });
    }

    worksheet.addRow([]);
    worksheet.addRow(["Summary"]);
    const sum = summary[0] || {};
    worksheet.addRow(["Total Orders:", sum.totalOrders || 0]);
    worksheet.addRow(["Total Amount:", sum.totalAmount || 0]);
    worksheet.addRow(["Total Discount:", sum.totalDiscount || 0]);

    ["price", "discount", "totalAmount"].forEach((key) => {
      worksheet.getColumn(key).numFmt = "₹#,##0.00";
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=SwizzTimes_SalesReport.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Swizz-Times Excel report:", error);
    res.redirect("/admin/pageerror");
  }
};


const downloadPDFReport = async (req, res) => {
  try {
    const { filter = "daily", startDate, endDate } = req.query;
    const dateFilter = createDateFilter(filter, startDate, endDate);
    const queryFilter = { ...dateFilter };

    console.log("PDF Query Filter:", queryFilter);

    const orders = await Order.find(queryFilter).populate("items.product");
    console.log("PDF Report Orders:", orders.length, orders.map(o => ({ orderId: o.orderId, createdAt: o.createdAt, orderStatus: o.orderStatus })));

    const summary = await Order.aggregate([
      { $match: queryFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalDiscount: { $sum: { $add: ["$discount", "$couponDiscount"] } },
        },
      },
    ]);

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=SwizzTimes_SalesReport.pdf");
    doc.pipe(res);

 
    doc.fontSize(20).text("Swizz-Times Sales Report", { align: "center" }).moveDown();
    doc.fontSize(12)
      .text(`Filter: ${filter}`)
      .text(`Date Range: ${format(dateFilter.createdAt.$gte, "yyyy-MM-dd")} to ${format(dateFilter.createdAt.$lte, "yyyy-MM-dd")}`)
      .moveDown();

  
    doc.fontSize(12).text("Orders:", { underline: true }).moveDown(0.5);

    if (orders.length === 0) {
      doc.fontSize(12).text("No orders found for the selected date range.", { align: "center" });
    } else {
      orders.forEach((order, index) => {
        doc.fontSize(10).font("Helvetica-Bold").text(`Order ${index + 1}: ${order.orderId}`);
        doc.fontSize(10).font("Helvetica");
        order.items.forEach((item) => {
          doc.text(`Date: ${format(order.createdAt, "yyyy-MM-dd")}`);
          doc.text(`Product: ${item.product?.productName || "N/A"}`);
          doc.text(`Quantity: ${item.quantity || 0}`);
          doc.text(`Price: ₹${(item.price || 0).toFixed(2)}`);
          doc.text(`Discount: ₹${(order.discount + order.couponDiscount).toFixed(2)}`);
          doc.text(`Total: ₹${order.totalAmount.toFixed(2)}`);
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      });
    }

    doc.moveDown().fontSize(12).text("Summary:", { underline: true }).fontSize(11);
    const sum = summary[0] || {};
    doc.text(`Total Orders: ${sum.totalOrders || 0}`);
    doc.text(`Total Amount: ₹${(sum.totalAmount || 0).toFixed(2)}`);
    doc.text(`Total Discount: ₹${(sum.totalDiscount || 0).toFixed(2)}`);

    doc.end();
  } catch (error) {
    console.error("Error generating Swizz-Times PDF report:", error);
    res.redirect("/admin/pageerror");
  }
};




export default{
  loadDashboard,
  getAnalyticsData,
  getTopPerformers,
  downloadExcelReport,
  downloadPDFReport,
};