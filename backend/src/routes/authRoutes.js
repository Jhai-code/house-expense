const express = require("express");

const router = express.Router();


router.post("/login", (req, res) => {

    const { username, password } = req.body;


    // Temporary users
    const validUsers = [
        {
            username: "jhaivignesh",
            password: "vicky@2005"
        },
        {
            username: "Muruga",
            password: "120369"
        },
        {
            username: "latha",
            password: "2005"
        }
    ];


    const user = validUsers.find(
        (user) =>
            user.username === username &&
            user.password === password
    );


    if (!user) {

        return res.status(401).json({
            success: false,
            message: "Invalid username or password"
        });

    }


    res.status(200).json({
        success: true,
        message: "Login successful",
        username: user.username
    });

});


module.exports = router;