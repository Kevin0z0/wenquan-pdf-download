// ==UserScript==
// @name         文泉学堂PDF下载
// @namespace    https://52pojie.cn
// @version      0.51
// @description  try to take over the world!
// @author       Culaccino
// @match        https://*.wqxuetang.com/read/pdf/*
// @grant        none
// @require      https://cdn.staticfile.org/jspdf/1.5.3/jspdf.min.js
// @require      https://cdn.staticfile.org/blueimp-md5/2.12.0/js/md5.min.js
// ==/UserScript==

(function() {
    const downloadNum = 50 //每次达到此页数就自动保存，可根据实际情况改动
    var imgBox, nowPage, allPage, doc, size, name, startNum = 1, isStart = false, pageList = [],beginTime = new Date()
    const baseURL = `https://${window.location.host}/`
    if(baseURL.indexOf("www") > -1){window.location.href=window.location.href.replace("www","lib-nuanxin")}
    const limitNum = [64655, 22471], limitMD5 = ["aba56eca9b49564cb47bce3f57bd14c2", "d9fff72044ac9a2726972b9dba58aa4e"]
    const bid = window.location.href.replace(baseURL + "read/pdf/","")
    const agent = navigator.userAgent
    const headers = {
        "headers": {
            "User-Agent": agent,
            "Accept": "*/*",
            "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
            "Cache-Control": "max-age=0"
        },
        "referrer": window.location.href,
        "method": "GET"
    }
    Array.prototype.remove = function(val) {
        const index = this.indexOf(val);
        if (index > -1) {
            this.splice(index, 1);
        }
    }
    function print(){console.log(...arguments)}
    //async function showInfo(v){
    //    let box = document.createElement("div")
    //    box.innerHTML = v
    //    box.setAttribute("style","display:inline-block;padding:8px 20px;position:fixed;top:0;left:50%;z-index:9999;color:#fff;background:#004DA9;border-radius:0 0 5px 5px;font-size:16px;")
    //    document.body.appendChild(box)
    //}
    function sleep (max,min) {
        const time = !min ? max : Math.floor(Math.random() * (max - min + 1) ) + min;
        print(time)
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    function createList(now){
        let arr = []
        for(let i = now || nowPage;i < Math.min((now || nowPage) + downloadNum, allPage + 1); i++) arr.push(i)
        startNum = arr[0]
        return arr
    }
    function imgCheck(c){
        if(c.length in limitNum && md5(c) in limitMD5)
            return false
        return true
    }
    function addPDF(base64){
        doc.addImage(base64, 'JPEG', 0, 0, size[0], size[1])
    }
    function savePDF(num){
        doc.save(`${name}_${num !== allPage ? num - downloadNum + 1 : Math.max(Math.floor(num / downloadNum) * downloadNum + 1, nowPage)}-${num}.pdf`)
        if(num !== allPage)
            doc = new jsPDF(size[0] < size[1] ? "" : "l", 'pt', size)
        print("总耗时 " + parseInt((new Date() - beginTime) / 1000 / 60) + " 分钟")
    }
    function getName(v){
        name = v.data.name
    }
    function getInfo(url){
        const data = fetch(url, headers).then(function(res){
            if(res.status >=200 && res.status <300){
                return res.json();
            }else{
                throw new Error(res.statusText)
            }
        })
        data.then(v=>{getName(v)})
    }
    function getImg(num){
        const base64 = imgBox[num].firstChild.getAttribute("src");
        let img = new Image();
        img.src = base64;
        img.onload = async function(){
            size = [img.width, img.height];
            if(!isStart){
                doc = new jsPDF(size[0] < size[1] ? "" : "l", 'pt', size)
                isStart = !isStart
            }
            addPDF(base64)
            if(num === allPage) {
                isStart = !isStart
                savePDF(num)
                return
            }else if(num % downloadNum === 0){
                savePDF(num)
                pageList = createList(num + 1)
                autoScroll(0)
                return
            }
            doc.addPage()
            getImg(num += 1)
        }
    }
    async function autoScroll(num){
        if(pageList.length === 0) {
            isStart = !isStart
            Download()
            return
        }
        if(pageList[num - 1] === pageList[pageList.length - 1]) {
            num = 0
        }
        print(pageList[num],num,pageList.length)
        document.documentElement.scrollTop = imgBox[pageList[num]].offsetTop
        let src = imgBox[pageList[num]].firstChild.getAttribute("src")
        if(!src || src.indexOf("data:image/") === -1){
            await sleep(6000,8000)
            src = imgBox[pageList[num]].firstChild.getAttribute("src")
        }
        if(!src || src.indexOf("width=100") > -1 || !imgCheck(src)){
            //print(pageList,src)
            autoScroll(num += 1)
        }else{
            pageList.remove(pageList[num])
            //print(pageList)
            autoScroll(num)
        }
    }
    function Download(){
        getImg(startNum)
    }
    window.onload = function(){
        document.getElementById("pagebox").onclick = function(){
            if(!isStart){
                const numBox = document.getElementsByClassName("page-head-tol")[0].innerHTML
                getInfo("https://lib-nuanxin.wqxuetang.com/v1/read/initread?bid="+bid)
                imgBox = document.getElementsByClassName("page-img-box")
                nowPage = parseInt(numBox.slice(0, numBox.indexOf("/") - 1))
                allPage = imgBox.length - 1
                isStart = !isStart
                pageList = createList()
                autoScroll(0)
            }else{
                return
            }
        }
        window.onbeforeunload=function(){
            if(isStart) {
                return "leave？";
            }
        }
    }
})();
