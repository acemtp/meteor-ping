if (Meteor.isClient) {

	Session.setDefault('uid', Random.id());
	Session.setDefault('ping', 0);

	Meteor.startup(function () {

		Meteor.setInterval(function () {
			var before = new Date().getTime();
			Meteor.call('keepAlive', Session.get('uid'), Session.get('ping'), navigator.userAgent, function (error, result) {
				var after = new Date().getTime();
				if(error) console.log(error);
				var ping = after - before;
				Session.set("ping", ping)
				//console.log("ping in ", ping);
				//document.title = ping;
			});
		}, 1000);
	});

	Template.pings.me = function () {
  	return Session.equals('uid', this._id);
  }


	Template.pings.pings = function () {
  	return Pings.find({}, {sort: {createdAt: -1}});
  }

	Template.ping.meanPing = function () {
  	var tab = this.stats;
  	var res = 0;
  	_.each(tab, function(ping) {
  		res = res + ping;
  	});
  	return Math.floor(res / _.size(tab));
  }

}

Pings = new Meteor.Collection("pings");

if (Meteor.isServer) {
	Meteor.methods({
	  keepAlive: function (uid, ping, uagent) {
	  	var p = Pings.findOne(uid);
	  	if(p)
		  	Pings.update(uid, {$set: {ping:ping, updatedAt: new Date().getTime()}});
		  else
		  	Pings.insert({_id: uid, ping:ping, uagent: uagent, createdAt: new Date().getTime(), stats: [0,0,0,0,0,0,0,0,0,0] });

		  Pings.update(uid, { $push: { "stats" : ping } } );
		  Pings.update(uid, { $pop: { "stats": -1 } } );

			return true;
		}
	});

	Meteor.setInterval(function () {
    var now = (new Date()).getTime();
    var before = (now - 5000);
    Pings.find({updatedAt: {$lt: before}}).forEach(function (ping) {
      Pings.remove( ping._id );
    });
	}, 1000*5);

}
