use API_Repository
db.createUser({ user: "admin", pwd: "mdp", roles: [{ role: "readAnyDatabase", db: "admin" }] })