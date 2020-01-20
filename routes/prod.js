/*jshint esversion: 6 */

//---- import libraries
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const util = require(__BASEDIR + '/util');
//---------------

//---- 기본 library 셋팅
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
//----------

//render root 
/*
router.get("/", (req, res) => {
	util.log("메인화면");
	//main 으로 들어오면 게시판 목록 페이징 처리로 redirect
	res.redirect('/paging/' + 1);
});
*/

//메인화면
router.get("/main", (req, res) => {
	util.log("메인화면");
	//main 으로 들어오면 바로 페이징 처리
	res.redirect('/paging/' + 1);
});

//-- List
router.get("/paging/:cur", (req, res) => {

	//--- userinfo
	let cu = util.userData;
	util.log("**** current user => " + cu.username + "," + cu.name + "," + cu.email);
	//-------

	//-- 전체 게시물 수 구한 후 요청된 페이지 표시
	let token = req.cookies[__ACCESS_TOKEN_NAME];
	let _headers = {};
	util.log("request token => " + token);
	_headers[__ACCESS_TOKEN_NAME] = token;
	axios.get(__API_PRODUCT_URI + "/count", {
		headers: _headers
	})
	.then((ret) => {
		util.log("Success to get product count!");
		let data = ret.data;
		let count = (data.success == false ? 0 : data.value);
		renderPage(count);
	})
	.catch((error) => {
		console.error("Fail to get product count", error);
	});

	const renderPage = function (count) {
		const pageSize = 10;		//한 페이지당 문서수
		const pageListSize = 5;		//navaigator bar에 보일 페이지 수
	
		let totalCount = count;			//전체문서수
		if(totalCount < 0) totalCount = 0;

		//-- 전체 문서수에 따른 페이징 control 변수 셋팅
		let curPage = parseInt(req.params.cur);					// 현재 페이지
	
		let totalPage = Math.ceil(totalCount / pageSize);		// 전체 페이지수
		let totalSet = Math.ceil(totalPage / pageListSize); 	// 전체 페이지 세트수
		let curSet = Math.ceil(curPage / pageListSize); 		// 현재 셋트 번호
		let startPage = ((curSet - 1) * pageListSize) + 1; 		// 현재 세트내 출력될 시작 페이지
		let endPage = (startPage + pageListSize) - 1; 			// 현재 세트내 출력될 마지막 페이지
		let startNo = (curPage < 0 ? 0 : (curPage - 1) * pageSize);	//시작 일련 번호 

		let pagingControls = {
			"curPage": curPage,
			"pageListSize": pageListSize,
			"pageSize": pageSize,
			"totalPage": totalPage,
			"totalSet": totalSet,
			"curSet": curSet,
			"startPage": startPage,
			"endPage": endPage,
			"startNo": startNo
		};
		util.log(pagingControls);
		//---------

		//--- 요청된 페이지 데이터 표시
		axios.get(__API_PRODUCT_URI + "/entries", {
			headers: _headers,
			params: {
				order: ["id", "DESC"],
				offset: startNo,
				limit: pageSize
			}
		})
		.then((ret) => {
			let data = ret.data;
			if (data.success) {
				util.log("Success to get entries !");
				res.render("views/main", {
					data: data.value,
					paging: pagingControls,
					user: util.userData
				});
			} else {
				console.error("Fail to get entries", data.msg);
			}
		})
		.catch((error) => {
			console.error("Fail to get entries", error);
		});
	}
});

//-- New
router.get("/insert", function (req, res) {
	util.log("새로운 상품 등록");

	res.render("views/insert", {
		mode: "insert",
		user: util.userData
	});
});

//--Create
router.post("/insert", (req, res) => {
	util.log("새로운 상품 저장");

	let body = req.body;
	let token = req.cookies[__ACCESS_TOKEN_NAME];
	let _headers = {}
	_headers[__ACCESS_TOKEN_NAME] = token;

	axios.post(__API_PRODUCT_URI+"/insert", 
	body,
	{
		headers: _headers
	})
	.then((ret) => {
		let data = ret.data;
		if (ret.status == 200) {
			if (data.success) {
				util.log("##### Success to create");
			} else {
				util.log("저장중 ERROR: " + data.msg);
			}
		} else {
			util.log("저장중 ERROR: " + ret.status);
		}
	})
	.catch((error) => {
		console.error(error);
	})
	.finally(() => {
		res.redirect("/main");
	});
});

//--Show
router.get("/detail/:id", (req, res) => {
	util.log("상품정보 조회");
	let token = req.cookies[__ACCESS_TOKEN_NAME];
	getEntry(req.params.id, token, function(ret) {
		if(ret != null) {
			res.render("views/detail", {
				mode: "view",
				data: ret
			});				
		}
	});
});

//--Edit
router.get("/edit/:id", (req, res) => {
	util.log("상품수정");
	let token = req.cookies[__ACCESS_TOKEN_NAME];
	getEntry(req.params.id, token, function(ret) {
		if(ret != null) {
			res.render("views/edit", {
				mode: "edit",
				data: ret
			});				
		}
	});
});

//--Update
router.post("/edit/:id", (req, res) => {
	util.log("상품 수정 데이터 저장");

	let body = req.body;
	let token = req.cookies[__ACCESS_TOKEN_NAME];
	let _headers = {}
	_headers[__ACCESS_TOKEN_NAME] = token;
	axios.post(__API_PRODUCT_URI+"/edit", 
	body,
	{
		headers: _headers,
		params: { prod_id: req.params.id }
	})
	.then((ret) => {
		let data = ret.data;
		if (ret.status == 200) {
			if (data.success) {
				util.log("##### Success to update");
			} else {
				util.log("저장중 ERROR: " + data.msg);
			}
		} else {
			util.log("저장중 ERROR: " + ret.status);
		}
	})
	.catch((error) => {
		console.error(error);
	})
	.finally(() => {
		res.redirect("/main");
	});
});

//--Destroy
router.get("/delete/:id", (req, res) => {
	util.log("상품 삭제");

	let token = req.cookies[__ACCESS_TOKEN_NAME];
	let _headers = {}
	_headers[__ACCESS_TOKEN_NAME] = token;
	axios.get(__API_PRODUCT_URI + "/delete", {
		headers: _headers,
		params: {
			prod_id: req.params.id
		}
	})
	.then((ret) => {
		util.log("Success to delete data !");
		let data = ret.data;
		util.log(data);
	})
	.catch((error) => {
		console.error("Fail to delete data!", error);
	})
	.finally(()=>{
		res.redirect("/main");
	});	
});


//--- get one data
let getEntry = function(id, token, callback) {
	let _headers = {}
	_headers[__ACCESS_TOKEN_NAME] = token;
	axios.get(__API_PRODUCT_URI + "/detail", {
		headers: _headers,
		params: {
			prod_id: id
		}
	})
	.then((ret) => {
		util.log("Success to get detail info !");
		let data = ret.data;
		util.log(data.value);
		callback(data.value);	
	})
	.catch((error) => {
		console.error("Fail to get product info!", error);
		callback(null);
	});	
}

module.exports = router;
