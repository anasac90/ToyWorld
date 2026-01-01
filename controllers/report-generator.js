const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const orderDB = require("../models/orderDB");
const addressDB = require("../models/addressDB");
const productDB = require("../models/productDB");
const usersDB = require("../models/usersDB");
const { startOfDay, subDays, subMonths, subYears } = require('date-fns');


const generatePdf = async (req, res) => {
  try {
    let { startDate, endDate, overallReport, individualReport } = req.body;
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    const doc = new PDFDocument({ margin: 40 });

    doc.registerFont(
      "NotoSans",
      path.join(__dirname, "../public/font/NotoSans-Regular.ttf")
    );

    doc.font("NotoSans");

    const filePath = path.join(
      __dirname,
      "../downloads/sales-report.pdf"
    );
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // TITLE
    doc.fontSize(20).text("Sales Report", { align: "center" });
    doc.moveDown(1);

    doc
      .fontSize(14)
      .text(
        `Report Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
        { align: "center" }
      );

    doc.moveDown(2);

    // Overall summary
    doc.x = 50;
    doc.fontSize(16).text("Overall Summary", {
      underline: true,
      align: "left"
    });
    doc.moveDown(1);

    // Summary table rows
    const summaryRows = [
      ["Total Order Amount:", `₹ ${overallReport.totalOrderAmount}`],
      ["Total Offer Discount:", `₹ ${overallReport.totalOfferDiscount}`],
      ["Total Coupon Discount:", `₹ ${overallReport.totalCouponDiscount}`],
      ["Total Sales Count:", overallReport.totalSales.toString()]
    ];

    const leftX = 50;
    const rightX = 300;  // alignment anchor point
    let summaryY = doc.y;

    summaryRows.forEach(([label, value]) => {
      // left column - normal alignment
      doc.fontSize(12).text(label, leftX, summaryY);

      // right column - PERFECT right alignment
      doc.text(value, rightX, summaryY, {
        width: 200,         // width of the right column
        align: "right"      // aligns numbers to the right edge
      });
      summaryY += 25;

      doc
        .moveTo(leftX, summaryY)
        .lineTo(550, summaryY)
        .strokeColor("#cccccc")
        .stroke();


      summaryY += 5;
    });

    doc.moveDown(2);

    // Individula sales report
    doc.x = 50;
    doc.fontSize(16).text("Individual Sales Report", {
      underline: true,
      align: "left"
    });
    doc.moveDown(1);

    // Table headers
    const tableTop = doc.y;
    const colX = {
      date: 50,
      orderId: 130,
      amount: 290,
      offer: 360,
      coupon: 450,
      count: 530
    };

    doc.fontSize(12).font("NotoSans").text("Date", colX.date, tableTop);
    doc.text("Order ID", colX.orderId, tableTop);
    doc.text("Amount", colX.amount, tableTop);
    doc.text("Offer Disc.", colX.offer, tableTop);
    doc.text("Coupon Disc.", colX.coupon, tableTop);
    doc.text("Count", colX.count, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(580, tableTop + 15)
      .strokeColor("#000")
      .stroke();

    let rowY = tableTop + 25;

    individualReport.forEach((order) => {
      doc.fontSize(11);
      doc.text(order.date, colX.date, rowY);
      doc.text(order._id, colX.orderId, rowY, { width: 150 });
      doc.text(`₹ ${order.amount}`, colX.amount, rowY);
      doc.text(`₹ ${order.discount}`, colX.offer, rowY);
      doc.text(`₹ ${order.coupon}`, colX.coupon, rowY);
      doc.text(order.salesCount, colX.count, rowY);

      rowY += 20;

      // table row line
      doc
        .moveTo(50, rowY)
        .lineTo(580, rowY)
        .strokeColor("#e0e0e0")
        .stroke();

      rowY += 5;
    });

    doc.end();

    writeStream.on("finish", () => {
      return res.json({ success: true });
    });

  } catch (error) {
    console.error("Error: " + error);
    res.json({ success: false });
  }
};


const generateExcel = async (req, res) => {
  try {
    let { startDate, endDate, overallReport, individualReport } = req.body;

    startDate = new Date(startDate);
    endDate = new Date(endDate);

    // Create workbook + worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');

    sheet.getColumn(1).width = 100;

    // Title
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'Sales Report';
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getCell('A1').font = { size: 20, bold: true };


    sheet.mergeCells('A2:F2');
    sheet.getCell('A2').value =
      `Report Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
    sheet.getCell('A2').alignment = { horizontal: "center" };
    sheet.getCell('A2').font = { size: 14 };

    // Add some spacing
    sheet.addRow([]);
    sheet.addRow([]);

    // Overall sales summary
    sheet.addRow(["Overall Summary"]);
    sheet.getRow(sheet.lastRow.number).font = { bold: true, size: 14 };

    sheet.addRow([
      "Total Order Amount", `₹ ${overallReport.totalOrderAmount}`
    ]);
    sheet.addRow([
      "Total Offer Discount", `₹ ${overallReport.totalOfferDiscount}`
    ]);
    sheet.addRow([
      "Total Coupon Discount", `₹ ${overallReport.totalCouponDiscount}`
    ]);
    sheet.addRow([
      "Total Sales Count", overallReport.totalSales.toString()
    ]);

    // Style summary table
    const summaryStart = 6;
    for (let i = summaryStart; i <= summaryStart + 4; i++) {
      sheet.getRow(i).eachCell(cell => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
        cell.font = { size: 12 };
      });
    }

    sheet.addRow([]);
    sheet.addRow([]);

    // Individual sales report
    sheet.addRow(["Individual Sales Report"]);
    sheet.getRow(sheet.lastRow.number).font = { bold: true, size: 14 };

    sheet.addRow([
      "Date",
      "Order ID",
      "Order Amount",
      "Offer Discount",
      "Coupon Discount",
      "Sales Count"
    ]);

    // Make headers bold
    sheet.getRow(sheet.lastRow.number).eachCell(cell => {
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });

    // Add rows for each order
    individualReport.forEach(order => {
      sheet.addRow([
        order.date,
        order._id,
        `₹ ${order.amount}`,
        `₹ ${order.discount}`,
        `₹ ${order.coupon}`,
        order.salesCount
      ]);
    });

    // Style individual rows
    const tableStart = sheet.lastRow.number - individualReport.length;

    for (let i = tableStart; i <= sheet.lastRow.number; i++) {
      sheet.getRow(i).eachCell(cell => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    }

    // Set column widths
    sheet.columns = [
      { width: 18 },
      { width: 30 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 12 }
    ];

    // ------------------------------
    // Save Excel File
    // ------------------------------
    const filePath = path.join(__dirname, '../downloads/sales-report.xlsx');
    await workbook.xlsx.writeFile(filePath);

    res.json({ success: true });

  } catch (error) {
    console.error("Excel error:", error);
    return res.json({ success: false });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const invoiceId = req.body.invoiceId;
    const orderId = req.body.orderId;

    const orderData = await orderDB.findOrder(orderId);
    const [userData] = await usersDB.findUserById(orderData.user_id);
    const [addressData] = await addressDB.findAddress(orderData.address_id);
    const orderDate = orderData.orderDate;
    const orderTime = orderData.orderTime;
    const productTotalPrice = orderData.productPrice;
    const discount = orderData.discount;
    const orderValue = orderData.orderValue;
    const productsDetails = await Promise.all(
      orderData.products.map(async product => {
        const productCode = product.productCode;
        [productDetail] = await productDB.getProducts({ productCode: productCode });
        return productDetail;
      })
    )

    // create a new pdf document
    const doc = new PDFDocument({ margin: 50 });

    // assigning font
    doc.registerFont('NotoSans', path.join(__dirname, '../public/font/NotoSans-Regular.ttf'));

    // choose font
    doc.font('NotoSans')

    // set the file name
    const filePath = path.join(__dirname, `../downloads/invoice ${invoiceId}.pdf`);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // title
    doc.fontSize(24).text('Tax Invoice', { align: 'center', underline: true }).moveDown(1);

    // from address
    doc.fontSize(14).text('Sold by: Toy World Private Limited', { align: 'left', continued: true })
      .text(`Invoice Number: ${invoiceId}`, { align: 'right' });
    doc.fontSize(12).text(`Ship from: Toy World, Malappuram, Sha Complex,`);
    doc.fontSize(12).text(`Room no: 35/2, Varangod Post, PIN: 676519`);
    doc.moveDown();

    // Address details
    doc.fontSize(14).text('Billing Address', { underline: true });
    doc.fontSize(13).text(`${userData.fname} ${userData.lname}`);
    doc.fontSize(12).text(`${addressData.house}, ${addressData.street}`);
    doc.fontSize(12).text(`${addressData.post}, ${addressData.city}, ${addressData.district}, ${addressData.state}`);
    doc.fontSize(12).text(`PIN: ${addressData.pincode}`);
    doc.fontSize(12).text(`Mobile: ${addressData.mobile}`);
    doc.moveDown();

    doc.fontSize(12).text(`Order Date: ${orderDate}`);
    doc.fontSize(12).text(`Order Time: ${orderTime}`).moveDown();

    doc.fontSize(14).text('Product Details', { underline: true }).moveDown(0.5);

    // Define table starting position
    const startX = 50;
    let startY = doc.y + 10;

    // Column widths
    const colWidths = [100, 200, 80, 80, 80];

    // Draw table header
    doc.fontSize(12).text('Product Code', startX, startY, { bold: true });
    doc.text('Product Name', startX + colWidths[0], startY);
    doc.text('Quantity', startX + colWidths[0] + colWidths[1], startY);
    doc.text('Price', startX + colWidths[0] + colWidths[1] + colWidths[2], startY);
    doc.text('Total', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], startY);
    doc.moveDown(0.5);

    // a seperator line
    doc.moveTo(startX, startY + 15)
      .lineTo(startX + colWidths.reduce((a, b) => a + b), startY + 15)
      .stroke();

    startY += 20;

    // product details
    productsDetails.forEach((product, index) => {
      doc.text(product.productCode, startX, startY);
      doc.text(product.productName, startX + colWidths[0], startY, { width: colWidths[1], ellipsis: true });
      doc.text(orderData.products[index].quantity.toString(), startX + colWidths[0] + colWidths[1], startY);
      doc.text(`₹${product.price}`, startX + colWidths[0] + colWidths[1] + colWidths[2], startY);
      doc.text(`₹${(product.price * orderData.products[index].quantity).toString()}`, startX +
        colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], startY);

      startY += 20;
    });

    // a seperator line
    doc.moveTo(startX, startY)
      .lineTo(startX + colWidths.reduce((a, b) => a + b), startY)
      .stroke();

    doc.moveDown();

    const rightAlignX = 390;
    let currentY = doc.y + 10;

    doc.fontSize(14).text(`Total Amount: ₹${productTotalPrice}`, rightAlignX, currentY);
    currentY += 20;
    doc.text(`Discount: ₹${discount}`, rightAlignX, currentY);
    currentY += 20;
    doc.text(`Order Value: ₹${orderValue}`, rightAlignX, currentY);

    currentY += 80;
    doc.text(`Authorized sign: `, rightAlignX, currentY);


    doc.end();

    res.json({ success: true, invoice: invoiceId });

  } catch (error) {
    console.error('Error: ' + error);
    res.json({ success: false });
  }
}


const bestSellingProducts = async (req, res) => {
  try {
    let filterOption = req.params.filter ? req.params.filter : 'yearly';
    const now = new Date();

    let startDate;
    if (filterOption === 'weekly') {
      startDate = startOfDay(subDays(now, 7));
    } else if (filterOption === 'monthly') {
      startDate = startOfDay(subMonths(now, 1));
    } else { // yearly default
      startDate = startOfDay(subYears(now, 1));
      filterOption = 'yearly'; // normalize
    }

    // 1. Top products / categories / brands
    const bestProducts = await orderDB.homeDataQuery(startDate);
    const bestCategories = await orderDB.homeCategoryDataQuery(startDate);
    const bestBrands = await orderDB.homeBrandDataQuery(startDate);

    // 2. Sales trend
    const { labels: salesLabels, data: salesData } =
      await orderDB.getSalesTrend(startDate, filterOption);

    // 3. Summary cards
    const { totalRevenue, totalOrders } =
      await orderDB.getDashboardSummary(startDate);

    const totalProducts = await productDB.countActiveProducts();

    // 4. Category chart data
    const catLabels = bestCategories.map(c => c.name);
    const catData = bestCategories.map(c => c.sales);

    res.render("admin/home", {
      bestSellingProducts: bestProducts,
      bestSellingCategories: bestCategories,
      bestSellingBrands: bestBrands,
      salesLabels,
      salesData,
      catLabels,
      catData,
      totalRevenue,
      totalOrders,
      totalProducts,
      currentFilter: filterOption
    });

  } catch (error) {
    console.error('Error: ' + error);
    // fallback – no data
    res.render("admin/home", {
      bestSellingProducts: [],
      bestSellingCategories: [],
      bestSellingBrands: [],
      salesLabels: [],
      salesData: [],
      catLabels: [],
      catData: [],
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      currentFilter: 'yearly'
    });
  }
};


module.exports = {
  generatePdf,
  generateExcel,
  generateInvoice,
  bestSellingProducts,
}
