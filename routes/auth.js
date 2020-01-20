/*jshint esversion: 6 */

//--- import libraries
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const util = require(__BASEDIR+'/util');
//-----------

//---- 기본 library 셋팅
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());
//--------------

//--- Login화면 표시
router.get("/login", (req, res) => {
	util.log("Login 화면");
	res.cookie(__ACCESS_TOKEN_NAME, "");
	res.render("login/login");
});
//--------------

//--- 인증처리 로직
router.post("/login", (req, res) => {
	util.log("Login Process");
	let body = req.body;
	
	axios.post(__AUTH_API_URI+"/api/auth/login", 
		{
			username: body.username,
			password: body.password			
		}
	)
	.then((ret) => {
		if(ret.status == 200) {
			util.log("##### Gerated Access Token=>"+ret.data.data);
			res.cookie(__ACCESS_TOKEN_NAME, ret.data.data);		//cookie에 임시로 저장
			res.redirect("/main");
		} else {
			res.redirect("/login");
		}
	})
	.catch((error) => {
		console.error(error);
		res.redirect("/login");
	});	
});
//----------------

//--- 회원가입 화면 rendering
router.get("/signup", (req, res) => {
	util.log("회원가입 화면");
	res.render("login/signup", { mode: "get" });
});
//---------

//--- 회원가입 처리 
router.post("/signup", (req, res) => {
	util.log("회원가입 저장");
	let body = req.body;

	axios.post(__AUTH_API_URI+"/api/users", 
		{
			username: body.username,
			password: body.password	,
			passwordConfirmation: body.passwordConfirmation,
			name: body.name,
			email: body.email
		}
	)
	.then((ret) => {
		//util.log(ret);
		if(ret.status == 200) {
			let retData = {
				success: "",
				msg: ""
			}
			if(ret.data.success) {
				retData.success =  true;			
			} else {
				util.log("** ERROR=>"+ret.data.errors);	
				retData.success =  false;
				retData.msg = JSON.parse(ret.data.errors);
			}
			res.render("login/signup", { mode: "post", postData: body, result: retData });
		} else {
			res.redirect("/signup");
		}
	})
	.catch((error) => {
		console.error(error);
		res.redirect("/signup");
	});	
});
//--------------

//---- Logout
router.get("/logout", (req, res) => {
	util.log("Logout 화면");
	
	res.redirect("/login");
});
//-----------

module.exports = router;