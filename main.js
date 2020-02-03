// ==UserScript==
// @name         文泉学堂PDF下载
// @namespace    https://dsb.ink
// @version      0.1
// @description  文泉学堂PDF下载脚本，已测试火狐
// @author       zkw6666
// @match        https://lib-nuanxin.wqxuetang.com/read/pdf/*
// @grant        none
// @require      http://js.dsb.ink/js/hmac-sha256.js
// @require      http://js.dsb.ink/js/enc-base64-min.js
// @require      http://js.dsb.ink/js/jspdf.min.js
// ==/UserScript==

(function() {
    const bid = window.location.href.replace("https://lib-nuanxin.wqxuetang.com/read/pdf/","")
    const headers = {
        "credentials": "include",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0",
            "Accept": "*/*",
            "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
            "Cache-Control": "max-age=0"
        },
        "referrer": "https://lib-nuanxin.wqxuetang.com/read/pdf/" + bid,
        "method": "GET",
        "mode": "cors"
    }
    var doc,size,allPage,name,btn = document.createElement("button");
    const w = 100,
        h = 40
    btn.innerHTML = "初始化..."
    btn.setAttribute("style",`position: fixed; cursor:pointer;z-index: 10000; top: 0px; left: 50%; margin-left: -146.5px;width: ${w}px;height: ${h}px;border: none;background: #004DA9;color: #fff;font-size: 16px;border-radius: 0 0 10px 10px;`)
    btn.style.marginLeft = -w / 2 + "px"
    document.body.appendChild(btn)
    function print(){console.log(...arguments)}
    function error(){console.error(...arguments)}
    var Download = function(){
        return new Download.INIT()
    }

    Download.INIT = function(){
        const data = fetch("https://lib-nuanxin.wqxuetang.com/v1/read/initread?bid=" + bid, headers).then(function(res){
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
        this.page = 1;
        this.baseURL = "https://lib-nuanxin.wqxuetang.com/";
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
        data.then(v=>{d.getData(v, this.page)})
    }
    d.getData =function(a, p){
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
        catch(e){error("连接出错，开始重新获取", e);d.getData(a, p)}
        //doc.addImage(base64, 'JPEG', 0, 0, 1439, 1998)
        //doc.save('hello.pdf')
    }
    d.jsonWebToken = function(f,p,s){
        const b64 = f + "." +btoa(d.objToString(p)).replace(/[=]/g,"");
        var hash = CryptoJS.HmacSHA256(b64, s);
        var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
        hashInBase64 = hashInBase64.replace(/[+]/g, "-").replace(/[/]/g, "_").replace(/[=]/g, "")
        return `${this.baseURL}page/img/${this.bid}/${this.page}?k=${b64}.${hashInBase64}`
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
    //https://lib-nuanxin.wqxuetang.com/read/pdf/2175744
    d.convertImgToBase64 = function (url, ext, p, a) {
        let canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            img = new Image,
            data = ""
        btn.innerHTML = `${p}/${allPage}`
        img.crossOrigin = '';
        img.onload = function () {
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL('image/' + ext);
            canvas = null;
            doc.addImage(dataURL, 'JPEG', 0, 0, size[0], size[1])
            if(p === allPage){doc.save(name + '.pdf');btn.innerHTML = "已完成";return}
            doc.addPage()
            d.getData(a, p += 1)
        };
        img.src = url;
    }
    window.Download = Download;

    window.onload = function(){
        btn.innerHTML = "下载PDF"
        btn.onclick = function(){
            var getSize = function(){
                const imgBox = document.getElementsByClassName("page-img-box")[1]
                return [imgBox.offsetWidth,imgBox.offsetHeight]
            }
            size = getSize()
            let a = document.getElementsByClassName("page-head-tol")[0].innerHTML
            allPage = parseInt(a.slice(a.indexOf("/") + 1,a.length))
            this.innerHTML = "加载中...";
            doc = new jsPDF("", 'px', size)
            Download()
        }
    }
})();
