// setup plot
var series = {};
var options = {
    series: { shadowSize: 0 }, // drawing is faster without shadows
    yaxis: { min: 0, max: 1000 },
    xaxis: { show: false }
};


if (Meteor.isClient) {


 

	Session.setDefault('uid', Random.id());
	Session.setDefault('ping', 0);

	Meteor.startup(function () {
		console.log("startup");

		Pings.find().observe({
			changed : function(newDoc, oldDoc){
				var id = oldDoc._id;
//				var p = Pings.findOne({_id:Session.get('uid')});
				var p = Pings.findOne(id);
				if(p){
			    var res = [];
			    var data = p.stats;
	    		for (var i = 0; i < data.length; ++i)
	     		   res.push([i, data[i]])
	     		var name = id;
	     		if(newDoc.name !== "")
	     			name = newDoc.name;
	     		series[id] = {data : res, label : name};
	     		if(id===Session.get('uid')){
	     			series[id]["color"] = "rgba(0,0,0,1)";
	     		}

				}
			}
		});

		Meteor.setInterval(function () {
			{

				var res = [];
				_.each(series, function(el, index, list) {
						//console.log(index);
						res.push(el);
				})
				if(res)
				{
					var plot = $.plot($("#placeholder"), res, options);

				  plot.setData(res);
				  // since the axes don't change, we don't need to call plot.setupGrid()
				  plot.draw();

				}

			}


			var before = new Date().getTime();
			var name = "";
			if(Meteor.user() && Meteor.user().profile && Meteor.user().profile.name)
				name =  Meteor.user().profile.name;
			Meteor.call('keepAlive', Session.get('uid'), Session.get('ping'), navigator.userAgent, name, function (error, result) {
				var after = new Date().getTime();
				if(error) console.log(error);
				var ping = after - before;
				Session.set("ping", ping)
				//console.log("ping in ", ping);
				//document.title = ping;
			});
		}, 1000);
	});




	Template.pings.pingsAlive = function () {
  	return Pings.find({alive: true}, {sort: {createdAt: -1}});
  }

	Template.pings.pingsDead = function () {
  	return Pings.find({alive: false}, {sort: {createdAt: -1}});
  }


	Template.ping.me = function () {
  	return Session.equals('uid', this._id);
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
	  keepAlive: function (uid, ping, uagent, name) {
	  	var p = Pings.findOne(uid);
	  	if(p)
		  	Pings.update(uid, {$set: {ping:ping, alive: true, updatedAt: new Date().getTime(), name: name}});
		  else
		  	Pings.insert({_id: uid, alive: true, ping:ping, uagent: uagent, createdAt: new Date().getTime(), stats: [0,0,0,0,0,0,0,0,0,0], name: name });

		  Pings.update(uid, { $push: { "stats" : ping } } );
		  Pings.update(uid, { $pop: { "stats": -1 } } );

			return true;
		}
	});

	Meteor.setInterval(function () {
    var now = (new Date()).getTime();
    var before = (now - 5000);
    Pings.find({updatedAt: {$lt: before}}).forEach(function (ping) {
      //Pings.remove( ping._id );
      Pings.update(ping._id, {$set : {alive : false}});
    });
	}, 1000*5);

}
