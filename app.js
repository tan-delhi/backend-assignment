require('dotenv').config()
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
const mongoose = require('mongoose');
const Invoice = require('./models/product')
const easyinvoice = require('easyinvoice')
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const res = require('express/lib/response');
const fs = require('fs')
const nodemailer = require('nodemailer');
const req = require('express/lib/request');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))





mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!")
  })
  .catch(err => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!")
    console.log(err)
  })


// catch 404 and forward to error handler



app.listen(process.env.PORT || 3000, () => {
  console.log('server listening on port 3000');
})


app.get('/new', (req, res) => {
  res.render('new');
})


app.post('/products', async (req, res) => {

  const newProduct = new Invoice(req.body);
  newProduct.DueDate = newProduct.DueDate.toISOString().slice(0, 10)
  await newProduct.save();
  res.redirect(`/products/${newProduct._id}`)
})

app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findOne({ _id: id })

  res.render('show', { invoice })
})

app.post('/products/:id/download', async (req, res) => {

  const { id } = req.params;
  const invoice = await Invoice.findOne({ _id: id })
  console.log(invoice.to)

  const today = new Date().toISOString().slice(0, 10)

  const mp = invoice.DueDate.toISOString().slice(0, 10)

  const data = {
    // Customize enables you to provide your own templates
    // Please review the documentation for instructions and examples
    "customize": {
      //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html 
    },
    "images": {
      // The logo on top of your invoice
      "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
      // The invoice background
      "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
    },
    // Your own data
    "sender": {
      "company": "Sample Corp",
      "address": "Sample Street 123",
      "zip": "110092",
      "city": "Delhi",
      "country": "India",
      "custom1": invoice.from,

    },
    // Your recipient
    "client": {
      "company": "Client Corp",
      "address": "Clientstreet 456",
      "zip": "4567 CD",
      "city": "Clientcity",
      "country": "Clientcountry",
      "custom1": invoice.to,

    },
    "information": {
      // Invoice number
      "number": invoice._id,
      // Invoice data
      "date": today,
      // Invoice due date
      "due-date": mp
    },
    // The products you would like to see on your invoice
    // Total values are being calculated automatically
    "products": [
      {
        "quantity": 2,
        "description": invoice.item,
        "tax-rate": 6,
        "price": invoice.price
      }

    ],
    // The message you would like to display on the bottom of your invoice
    "bottom-notice": "Kindly pay your invoice within 15 days.",
    // Settings to customize your invoice
    "settings": {
      "currency": "USD", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
      // "locale": "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')
      // "tax-notation": "gst", // Defaults to 'vat'
      // "margin-top": 25, // Defaults to '25'
      // "margin-right": 25, // Defaults to '25'
      // "margin-left": 25, // Defaults to '25'
      // "margin-bottom": 25, // Defaults to '25'
      // "format": "A4" // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
    },
    // Translate your invoice to your preferred language
    "translate": {
      // "invoice": "FACTUUR",  // Default to 'INVOICE'
      // "number": "Nummer", // Defaults to 'Number'
      // "date": "Datum", // Default to 'Date'
      // "due-date": "Verloopdatum", // Defaults to 'Due Date'
      // "subtotal": "Subtotaal", // Defaults to 'Subtotal'
      // "products": "Producten", // Defaults to 'Products'
      // "quantity": "Aantal", // Default to 'Quantity'
      // "price": "Prijs", // Defaults to 'Price'
      // "product-total": "Totaal", // Defaults to 'Total'
      // "total": "Totaal" // Defaults to 'Total'
    },
  };

  const invoicepdf = async () => {

    const result = await easyinvoice.createInvoice(data);

    fs.writeFileSync(`./pdfs/invoice${id}.pdf`, result.pdf, 'base64');
  }

  invoicepdf();

  res.render('download', { invoice })

})


app.post('/products/:id/mail', async (req, res) => {

  const { id } = req.params;


  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER, // TODO: your gmail account 
      pass: process.env.PASSWORD // TODO: your gmail password
    }
  });

  let mailOptions = {
    from: process.env.USER, // TODO: email sender
    to: 'f20190117@goa.bits-pilani.ac.in', // TODO: email receiver
    subject: 'Your invoice is ready',
    text: 'Wooohooo it works!!',

    attachments: [
      { filename: `invoice${id}.pdf`, path: `./pdfs/invoice${id}.pdf` } // TODO: replace it with your own image
    ]

  };


  // Step 3
  transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
      console.log(err);
    }
    console.log('sad');
  });

  res.render('email', { id })

})

app.get('/late', async (req, res) => {



  const InvoiceLate = await Invoice.find({ "DueDate": { $gt: new Date('2022-02-09') } })
  console.log(InvoiceLate)


  res.render('latest', { InvoiceLate })



})

app.get('/late/mail', async (req, res) => {

  const InvoiceLate = await Invoice.find({ "DueDate": { $gt: new Date('2022-02-09') } })


  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER, // TODO: your gmail account 
      pass: process.env.PASSWORD // TODO: your gmail password
    }
  });


  for (var x in InvoiceLate) {

    var mailer = InvoiceLate[x].to;
    var date = InvoiceLate[x].DueDate.toISOString().slice(0, 10);

    const output = `
    
    <h3>Hello ${mailer} </h3>
    <p> Your invoice bill has exceeded the due date of ${date}. Kindly pay by earliest </p>
    <p> Taxadda.com
  `;
    let mailOptions = {
      from: process.env.USER, // TODO: email sender
      to: 'f20190117@goa.bits-pilani.ac.in', // TODO: email receiver
      subject: 'Late Invoice',
      html: output,

    }

    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        console.log(err);
      }
      console.log('sad');
    });

  };

  res.render('latest', { InvoiceLate })


})

module.exports = app;
