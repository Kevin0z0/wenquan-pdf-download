import requests
import fitz
from time import sleep
from json import loads

def pdfTOC(obj):
    for i in obj:
        toc.append([int(i["level"]),i["label"],int(i["pnum"])])
        if "children" in i:
            pdfTOC(i["children"])

bid = input("请输入书号： ")
url = "https://lib-nuanxin.wqxuetang.com/v1/book/catatree?bid=" + bid
bookURL = "https://lib-nuanxin.wqxuetang.com/v1/book/initbook?bid=" + bid

try:
    headers = {
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
        "Cookie":open("cookie.txt", "r").read()
    }
except:
    input("未检测到cookie.txt，请检查是否有此文件，按回车键退出")

try:
    data = loads(requests.get(url,headers=headers).text)["data"]
    name = loads(requests.get(bookURL,headers=headers).text)["data"]["name"]
except:
    input("可能是cookie过期了，请重新在网页中获取，按回车键退出")

try:
    doc = fitz.open(name + ".pdf")
    toc = doc.getToC()
    pdfTOC(data)
    doc.setToC(toc)
    doc.save(name + "_已加目录.pdf")
except:
    input("未获取到此目录下的书名，请再次检查，按回车键退出")
print("成功!")
sleep(10)