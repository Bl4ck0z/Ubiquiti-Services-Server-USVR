db.getSiblingDB("unifi").createUser({user: "unifi", pwd: "mSufJpHZH", roles: [{role: "dbOwner", db: "unifi"}]});
db.getSiblingDB("unifi_stat").createUser({user: "unifi", pwd: "mSufJpHZH", roles: [{role: "dbOwner", db: "unifi_stat"}]});