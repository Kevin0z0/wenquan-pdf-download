// ==UserScript==
// @name         文泉学堂PDF下载
// @namespace    https://52pojie.cn
// @version      0.53
// @description  try to take over the world!
// @author       Culaccino
// @match        https://*.wqxuetang.com/read/pdf/*
// @grant        none
// @require      https://cdn.staticfile.org/jspdf/1.5.3/jspdf.min.js
// @require      https://cdn.staticfile.org/blueimp-md5/2.12.0/js/md5.min.js
// ==/UserScript==

(function () {
    const downloadNum = 20 //每次达到此页数就自动保存，可根据实际情况改动
    var imgBox, nowPage, allPage, doc, size, name, startNum = 1,isStart = false, pageList, dataIndex, beginTime = new Date(),dataList = {}
    const baseURL = `https://${window.location.host}/`
    if (baseURL.indexOf("www") > -1) {
        window.location.href = window.location.href.replace("www", "lib-nuanxin")
    }
    const bid = window.location.href.replace(baseURL + "read/pdf/", "")
    const headers = {
        "headers": {
            "User-Agent": navigator.userAgent,
            "Accept": "*/*",
            "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
            "Cache-Control": "max-age=0"
        },
        "referrer": window.location.href,
        "method": "GET"
    }
    Array.prototype.remove = function (val) {
        const index = this.indexOf(val);
        if (index > -1) this.splice(index, 1)
    }
    function print() {
        console.log(...arguments)
    }
    function sleep(min, max) {
        min *= 1000;
        max *= 1000;
        const time = !min ? max : Math.floor(Math.random() * (max - min + 1)) + min;
        print(time)
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    function createList(now) {
        let arr = []
        for (let i = now || nowPage; i < Math.min((now || nowPage) + downloadNum, allPage + 1); i++) arr.push(i)
        startNum = arr[0]
        return arr
    }
    function addPDF(base64) {
        doc.addImage(base64, 'JPEG', 0, 0, size[0], size[1])
    }
    function savePDF(num) {
        doc.save(`${name}_${num !== allPage ? num - downloadNum + 1 : Math.max(Math.floor(num / downloadNum) * downloadNum + 1, nowPage)}-${num}.pdf`)
        if (num !== allPage) doc = new jsPDF(size[0] < size[1] ? "" : "l", 'pt', size)
        print("总耗时 " + parseInt((new Date() - beginTime) / 1000 / 60) + " 分钟")
    }
    function getInfo(url) {
        const data = fetch(url, headers).then(function (res) {
            if (res.status >= 200 && res.status < 300) return res.json();
            else throw new Error(res.statusText)
        })
        data.then(v => {name = v.data.name;print(name)})
    }
    function getImg(num) {
        const base64 = dataList[num];
        let img = new Image();
        img.src = base64;
        img.onload = function () {
            if (!isStart) {
                doc = new jsPDF(size[0] < size[1] ? "" : "l", 'pt', size)
                isStart = !isStart
            }
            addPDF(base64)
            if (num === allPage) {
                isStart = !isStart
                savePDF(num)
                return
            } else if (num % downloadNum === 0) {
                dataList = {}
                savePDF(num)
                pageList = dataIndex = createList(num + 1)
                autoScroll(0)
                return
            }
            doc.addPage()
            getImg(num += 1)
        }
    }
    async function autoScroll(num, isCorrect = true) {
        if (pageList.length === 0) {
            isStart = !isStart
            getImg(startNum)
            return
        }
        if (pageList[num - 1] === pageList[pageList.length - 1]) num = 0
        print(pageList[num], num, pageList.length)
        document.documentElement.scrollTop = imgBox[pageList[num]].offsetTop
        let src = imgBox[pageList[num]].firstChild.getAttribute("src")
        if (!src || src.indexOf("data:image/") === -1 || !isCorrect) {
            await sleep(8, 10)
            src = imgBox[pageList[num]].firstChild.getAttribute("src")
        }
        if (!src || src.indexOf("width=160") > -1) autoScroll(num += 1)
        else {
            let img = new Image();
            img.src = src;
            img.onload = async function () {
                let w = img.width, h=img.height
                if(!size){size = [w, h]}
                print([w, h])
                if(size[0] - w > 200){
                    autoScroll(num += 1, false)
                }else{
                    dataList[pageList[num]] = src
                    pageList.remove(pageList[num])
                    autoScroll(num)
                }
            }
        }
    }
    window.onload = function () {
        document.getElementById("pagebox").onclick = function () {
            if (!isStart) {
                const numBox = document.getElementsByClassName("page-head-tol")[0].innerHTML
                getInfo("https://lib-nuanxin.wqxuetang.com/v1/read/initread?bid=" + bid)
                imgBox = document.getElementsByClassName("page-img-box")
                nowPage = parseInt(numBox.slice(0, numBox.indexOf("/") - 1))
                allPage = imgBox.length - 1
                isStart = !isStart
                pageList = dataIndex = createList()
                autoScroll(0)
            } else return
        }
        window.onbeforeunload = function () {if (isStart) return "leave？"}
    }
})();
