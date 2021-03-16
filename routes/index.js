"use strict";
function includeAllRoutes(app, connection) {
	require('./medication-api')(app, connection);
	require('./supplier-api')(app, connection);
	require('./pointsAudit-api')(app, connection);
	require('./order-api')(app, connection);
}
module.exports = (app, connection) => {
	includeAllRoutes(app, connection);
};
