/*jshint esversion: 6 */
//--- import libraries
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const util = require(__dirname+'/util');
//----------

//--- global constants & 환경변수
global.__BASEDIR = __dirname + '/';
global.__ACCESS_TOKEN_NAME = "x-access-token";
global.__AUTH_API_URI = process.env.AUTH_API_URI || "http://localhost:3000";
global.__API_PRODUCT_URI = process.env.API_PRODUCT_URI || "http://localhost:8888/api/products";
const JWT_SECRET = process.env.JWT_SECRET || "MySecretKey";
const port = (process.env.PORT || 8090);
//--------


//---- 기본 library 셋팅
const app = express();
app.use(express.static(path.join(__BASEDIR, '/public')));		//static resource 폴더 
app.use(bodyParser.urlencoded({extended:false}));				//include request 객체 parser
app.use(cookieParser());										//include cookie parser
//-----------

//--- ejs(Embed JS) 환경 셋팅
app.set('view engine','ejs');							//ui page rendering 시 ejs 사용
app.set('views', path.join(__BASEDIR, '/templates'));	//ui rendering시 사용할 ejs파일 위치 지정
//-------------

//----- middle ware: routing되는 서버모듈 시작 전에 항상 수행-인증토큰 검증
app.use(function(req, res, next) {
	let pathname = req.url;
    util.log("Request for [" + pathname + "] received.");
	
	//-- root path는 liveness, readiness probe임
	if(pathname === "/") {
		res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8' });
		res.write('I am alive');
		res.end();
		next();
		return;
	}

    //--- Login page로 접근하는 경우는 처리 없이 진행
    if(pathname === "/login" || pathname === "/signup" || pathname === "/logout") {
    	next();
    	return;
	}
	
	//-- TODO - cookie가 아닌 Session에서 JWT KEY를 가져와, REDIS에서 해당 key의 JWT Token가져오도록 변경 필요
	let token = req.cookies[__ACCESS_TOKEN_NAME];
	if((typeof token == "undefined") || token == null) token = "";
	
    if(token === "") {
    	res.redirect("/login");
    	next();
    	return;
    }
    
	util.log("## Verificate access Token=>"+token);
	
	jwt.verify(token, JWT_SECRET, function(err, decoded) {
		if (err) {
			//Token이 유효하지 않은 경우 Login페이지로 이동
			console.error(err);
			res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8' });
			res.write('<h1>ID 또는 비밀번호가 틀립니다. 또는 인증서가 만료되었습니다.</h1><P><a href="/login">Try again</a>');
			res.end();
			next();
		} else {
			util.log("success to verify => " + JSON.stringify(decoded));
			util.userData.username = decoded.username;
			util.userData.name = decoded.name;
			next();
		}
	});
});
//-------------

//--- include 개발 모듈
app.use(require(path.join(__BASEDIR, "/routes/auth.js")));		//include 인증처리 
app.use(require(path.join(__BASEDIR, "/routes/prod.js")));		//include 상품정보처리
//--------

//----- start web server 
app.listen(port, () => {
	console.log('Listen: ' + port);
});
//----------------
