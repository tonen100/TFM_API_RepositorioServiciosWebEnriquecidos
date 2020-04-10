use API_Repository
db.createUser({ user: "admin", pwd: "mdp", roles: [{ role: "readAnyDatabase", db: "admin" }] })
db.users.save({
    "username": "Test",
    "email": "admin@test.com",
    "password": "mdp",
    "role": "Administrator"
});