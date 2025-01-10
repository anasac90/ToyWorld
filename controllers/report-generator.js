const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');


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
        res.json({success:false});
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
            {header:"Total Order Amount", key:"totalOrderAmount", width:10},
            {header:"Total offer discount", key:"totalOfferDiscount", width:10},
            {header:"Total coupon discount", key:'totalCouponDiscount', width:10},
            {header:"Total sales count", key:'totalSales',width:10}
        ]

        sheet.addRow(overallReport);
        sheet.getRow(1).eachCell(cell=>{
            cell.font = {bold:true};
        });

        const data = await workbook.xlsx.writeFile(filePath);
        res.json({success:true});

        
    } catch (error) {
        console.error('Error: '+error);
        res.json({success:false});
    }

}


module.exports = {
    generatePdf,
    generateExcel,
}
