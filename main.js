// ==UserScript==
// @name         文泉学堂PDF下载
// @namespace    https://52pojie.cn
// @version      0.26
// @description  try to take over the world!
// @author       Culaccino
// @match        https://*.wqxuetang.com/read/pdf/*
// @grant        none
// @require      https://cdn.staticfile.org/crypto-js/3.1.2/rollups/hmac-sha256.js
// @require      https://cdn.staticfile.org/crypto-js/3.1.2/components/enc-base64-min.js
// @require      https://cdn.staticfile.org/jspdf/1.5.3/jspdf.min.js
// @require      https://cdn.staticfile.org/blueimp-md5/2.12.0/js/md5.min.js
// ==/UserScript==

(function() {
    const baseURL = `https://${window.location.host}/`
    if(baseURL.indexOf("www") > -1){window.location.href=window.location.href.replace("www","lib-nuanxin")}
    const bid = window.location.href.replace(baseURL + "read/pdf/","")
    const headers = {
        "credentials": "include",
        "headers": {
            "User-Agent": navigator.userAgent,
            "Accept": "*/*",
            "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
            "Cache-Control": "max-age=0"
        },
        "referrer": window.location.href,
        "method": "GET",
        "mode": "cors"
    }
    var doc,size,allPage,name,errorTime = 0,nowPage,btn = document.createElement("button");
    const w = 100,
          h = 40;
    const wrap = document.createElement("div"),
          input = document.createElement("input"),
          style = document.createElement('style'),
          close = document.createElement("div");
    style.innerHTML = `#download{transition:.25s;position: fixed; cursor:pointer;z-index: 10000; top: 0px; left: 50%; margin-left: -146.5px;min-width: ${w}px;height: ${h}px;padding:8px;border: none;background: #004DA9;color: #fff;font-size: 16px;border-radius: 0 0 10px 10px;}#wrap{overflow:hidden;width: 200px;height: 200px;background: #004DA9;position: fixed;top: 0;left: 50%;margin-left: -100px;border-radius: 0 0 5px 5px;z-index: 9999;text-align:center;}input{width: 80%;text-align:center;display: inline-block;background: #053062;border: none;border-radius: 5px;height: 32px;color: #fff;}#close{width: 100%;height: 30px;position: absolute;bottom: 0;color: #fff;cursor:pointer;line-height:30px;transition:.25s;}#download:hover,#close:hover{background:#053062;}`
    btn.innerHTML = "初始化...";
    btn.setAttribute("id","download");
    btn.style.marginLeft = -w / 2 + "px";
    wrap.setAttribute("id","wrap");
    wrap.innerHTML = "<div style='width:100%;height:40px'></div>";
    input.setAttribute("type", "text");
    const input2 = input.cloneNode(true);
    input.setAttribute("placeholder","开始页(可不写)");
    input.style.margin = "20px 0";
    input2.setAttribute("placeholder","结束页(可不写)");
    close.innerHTML = "收起";
    close.setAttribute("id","close");
    wrap.appendChild(input);
    wrap.appendChild(input2);
    wrap.appendChild(close);
    document.body.appendChild(style);
    document.body.appendChild(btn);
    document.body.appendChild(wrap);
    close.onclick = function(){wrap.style.display = "none"};
    function print(){console.log(...arguments)}
    function error(){console.error(...arguments)}
    var Download = function(){
        return new Download.INIT()
    }

    Download.INIT = function(){
        const data = fetch(baseURL + "v1/read/initread?bid=" + bid, headers).then(function(res){
          if(res.status >=200 && res.status <300){
              return res.json();
          }else{
            var error = new Error(res.statusText)
            error.res = res
            throw error
          }})
        data.then(v=>{d.init(v)})
    }
    var d = Download.INIT.prototype;
    d.init = function(val){
        this.val = val["data"];
        this.baseURL = baseURL;
        this.bid = bid;
        this.jwtSecret = "g0NnWdSE8qEjdMD8a1aq12qEYphwErKctvfd3IktWHWiOBpVsgkecur38aBRPn2w";
        name = this.val["name"];
        const data = fetch(`${this.baseURL}v1/read/k?bid=${this.bid}`, headers).then(function(res){
          if(res.status >=200 && res.status <300){
          return res.json();
          }else{
            var error = new Error(res.statusText)
            error.res = res
            throw error
          }})
        data.then(v=>{d.getData(v, nowPage)})
    }
    d.getData = function(a, p){
        const time = Date.parse(new Date).toString().slice(0,10),
              foreCode = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
              payload = {
                 p: p,
                 t: parseInt(time + "000"),
                 b: this.bid,
                 w: 1e3,
                 k: a.data,
                 iat: parseInt(time)
              }
        const result = d.jsonWebToken(foreCode,payload,this.jwtSecret);
        d.convertImgToBase64(result, "jpeg",p, a)
    }
    d.jsonWebToken = function(f,p,s){
        const b64 = f + "." +btoa(d.objToString(p)).replace(/[=]/g,"");
        var hash = CryptoJS.HmacSHA256(b64, s);
        var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
        hashInBase64 = hashInBase64.replace(/[+]/g, "-").replace(/[/]/g, "_").replace(/[=]/g, "")
        return `${this.baseURL}page/img/${this.bid}/${nowPage}?k=${b64}.${hashInBase64}`
    }
    d.objToString = function(obj,onoff){
        let str = "{";
        const sym = v => {let a = onoff ? '\\"' : '"';return a + v + a}
        for(let i in obj){
            const item = obj[i]
            if(typeof item === "object"){
                str += sym(i) + ':"' + d.objToString(item,1) + '"'
            }else if(typeof item === "number"){
                str += sym(i) + ":" + item
            }else if(typeof item === "string"){
                str += sym(i) + ":" + sym(item)
            }
            str += ","
        }
        return str.slice(0,str.length - 1) + "}"
    }
    d.sleep = function sleep (time) {
        print(time)
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    d.randInt = function(min, max){
        return Math.floor(Math.random() * (max - min + 1) ) + min;
    }
    //https://lib-nuanxin.wqxuetang.com/read/pdf/2175744
    d.convertImgToBase64 = async function (url, ext, p, a) {
        let canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            img = new Image,
            data = ""
        img.crossOrigin = '';
        img.onload = async function () {
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);
            if(!size){size = [img.width,img.height];doc = new jsPDF("", 'pt', size)}
            var dataURI = canvas.toDataURL('image/' + ext);
            if(dataURI.length === 22471 && md5(dataURI) === "d9fff72044ac9a2726972b9dba58aa4e"){
                print("获取到加载中的图片，开始重新获取");
                errorTime += 1;
                if(errorTime === 5){doc.save(name + '.pdf');throw new Error('获取失败，稍等一会再试试吧');}
                await d.sleep(d.randInt(15000,30000))
                Download()
                return;
            }
            print("开始下载第" + p + "页")
            errorTime = 0;
            canvas = null;
            btn.innerHTML = `${p}/${allPage}`
            doc.addImage(dataURI, 'JPEG', 0, 0, img.width, img.height)
            if(p === allPage){doc.save(name + '.pdf');btn.innerHTML = "已完成";return}
            doc.addPage()
            await d.sleep(d.randInt(5000,12000))
            d.getData(a, nowPage = p += 1)
        };
        img.onerror = async function(){
            error("连接出错，开始重新获取", p);
            await d.sleep(d.randInt(15000,30000));
            d.getData(a, p)
        }
        img.src = url;
    }
    window.Download = Download;

    window.onload = function(){
        btn.innerHTML = "下载PDF"
        btn.onclick = function(){
            try{
                let a = document.getElementsByClassName("page-head-tol")[0].innerHTML
                let maxPage = parseInt(a.slice(a.indexOf("/") + 1,a.length))
                nowPage = parseInt(input.value) || 1
                allPage = Math.min(maxPage, parseInt(input2.value) || maxPage)
                this.innerHTML = "加载中...";
                Download()
            }catch(e){alert("无法获取页面，请等待页面出现图片之后再下载")}
        }
    }
})();
