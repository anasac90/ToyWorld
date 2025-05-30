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

        // create a new pdf document
        const doc = new PDFDocument;

        // assigning font
        doc.registerFont('NotoSans', path.join(__dirname, '../public/font/NotoSans-Regular.ttf'));

        // choose font
        doc.font('NotoSans')

        // set the file name
        const filePath = path.join(__dirname, '../downloads/sales-report.pdf');
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // add title
        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();

        // add report summary
        doc.fontSize(16).text(`Sales Summay from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, { align: 'center' });
        doc.fontSize(14).text(`Total Order Amount: ₹ ${overallReport.totalOrderAmount}`);
        doc.fontSize(14).text(`Total Offer Discount: ₹ ${overallReport.totalOfferDiscount}`);
        doc.fontSize(14).text(`Total Coupon Discount: ₹ ${overallReport.totalCouponDiscount}`);
        doc.fontSize(14).text(`Total Sales Count: ${overallReport.totalSales}`);
        doc.moveDown();

        // individual report
        doc.fontSize(16).text('Individual Sales Report', { align: 'center' })
        individualReport.map(order => {
            doc.fontSize(14).text(`Date: ${order.date}`)
            doc.fontSize(14).text(`Order ID: ${order._id}`)
            doc.fontSize(14).text(`Order Value: ₹ ${order.amount}`)
            doc.fontSize(14).text(`Offer Discount: ₹ ${order.discount}`)
            doc.fontSize(14).text(`Coupon Discount: ₹ ${order.coupon}`)
            doc.fontSize(14).text(`Sales Count: ${order.salesCount}`)
            doc.moveDown();
        })

        doc.end();

        res.json({ success: true });

    } catch (error) {
        console.error('Error: ' + error);
        res.json({ success: false });
    }
}

const generateExcel = async (req, res) => {

    try {
        let { startDate, endDate, overallReport, individualReport } = req.body;
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        // create a new workbook
        const workbook = new ExcelJS.Workbook();

        // create a new worksheet
        const sheet = workbook.addWorksheet('Sales Report');

        // create a file name
        const filePath = path.join(__dirname, '../downloads/sales-report.xlsx');

        // sheet.mergeCells('A1:D1');
        // sheet.getCell('A1').value = 'Sales Summary';
        // sheet.getCell('A1').alignment = {vertical:'middle',horizontal:'center'}
        // sheet.getCell('A1').font = {size:20}
        // sheet.mergeCells('A2:D2');
        // sheet.getCell('A2').value = `Sales data from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
        // sheet.getCell('A2').alignment = {vertical:'middle',horizontal:'center'}

        sheet.columns = [
            { header: "Total Order Amount", key: "totalOrderAmount", width: 20 },
            { header: "Total offer discount", key: "totalOfferDiscount", width: 20 },
            { header: "Total coupon discount", key: 'totalCouponDiscount', width: 20 },
            { header: "Total sales count", key: 'totalSales', width: 20 }
        ]

        sheet.addRow(overallReport);
        sheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true };
        });

        const data = await workbook.xlsx.writeFile(filePath);
        res.json({ success: true });


    } catch (error) {
        console.error('Error: ' + error);
        res.json({ success: false });
    }

}

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
        let filterOption = req.params.filter? req.params.filter : 'yearly';
        const now = new Date();

        let startDate;

        if (filterOption === 'weekly') {
            startDate = startOfDay(subDays(now, 7));
        } else if (filterOption === 'monthly') {
            startDate = startOfDay(subMonths(now, 1));
        } else if (filterOption === 'yearly') {
            startDate = startOfDay(subYears(now, 1));
        }

        const bestSellingProduct = await orderDB.homeDataQuery(startDate);

        res.render("admin/home", {
            bestSellingProducts : bestSellingProduct,
            bestSellingCategories: [],
            bestSellingBrands: []
        });

    } catch (error) {
         console.error('Error: ' + error);
    }
}

module.exports = {
    generatePdf,
    generateExcel,
    generateInvoice,
    bestSellingProducts,
}
