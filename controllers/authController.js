const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.signUp = async (req, res) => {
    const { username, password } = req.body;
    // encrypt password
    const hashpassword = await bcrypt.hash(password, 8)
    // check username in db
    const user = await User.findOne({ username })
    if (!user) {

        try {
            const newUser = await User.create({
                username,
                password: hashpassword,
            })
            /**
             * requset session
             */
            req.session.user = newUser;
            res.status(200).json({
                status: "success",
                data: newUser,
            });
        } catch (err) {
            res.status(400).json({
                status: "fail"
            });
        }

    } else {
        res.status(409).json({
            status: "fail",
            message: "username already exists"
        });
    }
}

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username })

        if (!user) return res.status(404).json({
            status: "fail",
            message: "User not found",
        })
        // decrypt password and check password from database
        const isCorrect = await bcrypt.compare(password, user.password)
        if (isCorrect) {
            /**
             * requset session
             */
            req.session.user = user;
            res.status(200).json({
                status: "success",
                data: user,
            });
        } else {
            res.status(400).json({
                status: "fail",
                message: "incorrect username or password",

            });
        }
    } catch (err) {
        // console.log(err)
        res.status(400).json({
            status: "fail"
        });
    }

}