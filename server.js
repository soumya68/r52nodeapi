const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connectDB = require('./database/mongoose');
const configDetails = require('./config/config.json')
const PORT = configDetails.development.PORT
var cron = require('node-cron');
const order = require('./models/order-schema');
const residents = require('./models/resident-schema');
const pointsAudit = require('./models/pointsAudit-schema');
var pointsModule = require('./module/pointsAudit_module')();
var cors=require('cors')
const corsOpts = {
  origin: '*',
  methods: ['GET', 'POST',],
  allowedHeaders: ['Content-Type',],
};

app.use(cors(corsOpts));
//const PORT = 8000
/*middlewares*/
app.use(bodyParser.json({
  limit: '150mb',
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.use(bodyParser.urlencoded({ limit: '150mb', extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});
//mongodb connection using mongoose
connectDB()
app.get('/', (req, res) => {
  res.send('Welcome to Unicef API!')
})
/*Incudes all API routes*/
require('./routes/index')(app, connectDB);
// Start the cron job ----will run every day midnight
cron.schedule("00 00 00 * * *", function () {
  // cron.schedule("*/10 * * * * *", function() { 
  updateOrderStatus(function (err, res) {
    if (err) {
    }
    else {
    }
  })
});
async function updateOrderStatus(callbackfn) {
  try {
    let result = await order.find({ isPointsAddedToResident: false })
    Promise.all(
      result.map(async ele => {
        // Update order status and points in the collections
        let orderdata = await order.findOneAndUpdate({ _id: ele._id },
          { $set: { isDelivered: true, isPointsAddedToResident: true } },
          { new: true })
        let auditdata = await pointsAudit.findOneAndUpdate({ orderId: ele._id },
          { $set: { isActive: false,earnedPointsExpiryDate : new Date() } },
          { new: true })
        let points = auditdata.earnedPoints
        let residentdata = await residents.findOneAndUpdate({ _id: ele._id },
          { $set: { isPointsAddedToResident: true, earnedPoints: points } },
          { new: true })
        let finalData = { ...orderdata, ...auditdata, ...residentdata }
        return finalData
      })
    ).then(function (documents) {
    });
    callbackfn(null, finalData);
  } catch (err) {
    callbackfn(err, null,);
  }
}
// End the cron job ----
// START OF  CRON JOB FOR RESIDENTS POINT EXPIRY PROCESS
// cron.schedule('59 23 * * *', () => {
//   
//   pointsModule.deactivatePoints(
//     function (error, message) {
//       if (error) {
//       }
//       else {
//       }
//       console.log('running a task at 11:59 PM every day');
//     })
// });
// END OF  CRON JOB FOR RESIDENTS POINT EXPIRY PROCESS
/*Listen express server on port*/
app.listen(process.env.PORT || PORT, () => {
  console.info(`Server is running on port.... ${process.env.PORT || PORT}`);
});


