// ==UserScript==
// @name         文泉学堂PDF下载
// @namespace    https://52pojie.cn
// @version      0.21
// @description  文泉学堂PDF下载，已支持报错重新下载当前图片
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
    var doc,size,allPage,name,errorTime = 0,nowPage = 1,btn = document.createElement("button");
    const w = 100,
          h = 40
    btn.innerHTML = "初始化..."
    btn.setAttribute("style",`position: fixed; cursor:pointer;z-index: 10000; top: 0px; left: 50%; margin-left: -146.5px;min-width: ${w}px;height: ${h}px;border: none;background: #004DA9;color: #fff;font-size: 16px;border-radius: 0 0 10px 10px;`)
    btn.style.marginLeft = -w / 2 + "px"
    document.body.appendChild(btn)
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
    d.getData = async function(a, p){
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
        try{d.convertImgToBase64(result, "jpeg",p, a)}
        catch(e){
            error("连接出错，开始重新获取", e, p);
            await d.sleep(d.randInt(1000,2000));
            d.getData(a, p)
        }
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
            await d.sleep(d.randInt(1000,2000)) //随机间隔时间
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
                allPage = parseInt(a.slice(a.indexOf("/") + 1,a.length))
                this.innerHTML = "加载中...";
                Download()
            }catch(e){alert("无法获取页面，请等待页面出现图片之后再下载")}
        }
    }
})();
