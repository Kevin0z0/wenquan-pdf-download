import fitz
import os
import requests
from json import loads
from re import match, sub
from PyPDF2 import PdfFileMerger

choice = input("[1]合并PDF并添加目录\n[2]仅添加目录\n[3]仅合并PDF\n请输入编号： ")

bid = input("请输入书号： ")
url = "https://lib-nuanxin.wqxuetang.com/v1/book/catatree?bid=" + bid
bookURL = "https://lib-nuanxin.wqxuetang.com/v1/book/initbook?bid=" + bid

bookList = {}
numList = []

def getNum(s):
    return int(match(name+"_(\d+)-\d+.pdf",s).group(1))

def pdfTOC(obj):
    for i in obj:
        toc.append([int(i["level"]),i["label"],int(i["pnum"])])
        if "children" in i:
            pdfTOC(i["children"])

try:
    headers = {
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
        "Cookie":open("cookie.txt", "r").read()
    }
except:
    input("未检测到cookie.txt，请检查是否有此文件，按回车键退出")
    exit(0)

try:
    data = loads(requests.get(url,headers=headers).text)["data"]
    name = loads(requests.get(bookURL,headers=headers).text)["data"]["name"]
    name = sub("[<>|\"\\\/:?*]", "_", name)
except:
    input("可能是cookie过期了，或是网页请求失败，请重新在网页中获取cookie或者稍等一会再重试，按回车键退出")
    exit(0)

if choice in ["1","3"]:
    for file in os.listdir("."):
        if name in file:
            n = getNum(file)
            bookList[n] = file
            numList.append(n)

    numList.sort()

    try:
        pdf_merger = PdfFileMerger()

        for i in numList:
            pdf_merger.append(bookList[i])

        pdf_merger.write(name + ".pdf")
        pdf_merger.close()
    except:
        input("合并pdf出错")

if choice in ["1","2"]:
    try:
        doc = fitz.open(name + ".pdf")
    except:
        input("未获取到此目录下的书名，请再次检查，按回车键退出")
        exit(0)

    try:
        toc = doc.getToC()
        pdfTOC(data)
        doc.setToC(toc)
        doc.save(name + "_已加目录.pdf")
    except:
        input("合并目录失败，请确保是否为完整的pdf，按回车键退出")
        exit(0)

if choice in ["1","3"]:
    s = input("是否删除分段文件,直接回车为否，或输入Y删除: ")

    if(s == "Y"):
        for i in bookList:
            os.remove(bookList[i])

input("成功!")
