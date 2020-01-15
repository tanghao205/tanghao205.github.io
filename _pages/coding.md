---
layout: archive
permalink: /coding/
title: " "
classes: wide
author_profile: true
header:
  image: "/images/H0.jpg"	

---
                     
# Production Cycle Time Estimate  

```python
import os
import random
import time
from datetime import datetime

class fileCheck:
    
    def __init__(self, folder, qty):
        self.folder = folder
        self.qty = qty
        
    def sample_file(self):
        ret = []
        file_all = os.listdir(self.folder)
        files = []
        for a in file_all:
            if(a.endswith('.csv')):
                files.append(a)
        l = random.sample(range(len(files)),self.qty)
        for i in l:
            ret.append(os.path.join(self.folder, files[i]))
        return ret
    
    def try_parsing_date(self, strr):
        fmt = ["%d %b %Y %H:%M:%S", ":%Y/%m/%d %H:%M:%S"]
        try:     
            return datetime.strptime(strr, fmt[0]).timestamp()
        except ValueError:
#             print(strr)
            return datetime.strptime(strr, fmt[1]).timestamp()
    
    def get_time(self, ret):
        time_s = []
        file_s = []
        for i in ret:
            with open(i, "r") as file:
                l = file.readlines()
            ll = l[2:3]
            t1 = self.try_parsing_date(str(ll[0][len(ll[0])-21:len(ll[0])-1]))
            t2 = os.path.getmtime(i) ## getmtime is modified time, getctime is create time
            ## change the t2 - t1 to modify time range t2 - t1 < 1800 is pretty much for all
            print(t2 - t1)
            if ((t2 - t1 > 1500) & (float(l[len(l)-1].split(',')[0]) == 400) & (len(l) < 420)):
                time_s.append(t2 - t1)
                file_s.append(i)
        return [time_s,file_s]
            
    
if __name__ == "__main__":
    fc = fileCheck('Y:\\DaviLotDatas\\10G_250_Tray02\\Data', 50)
    file_list = fc.sample_file()
    result = fc.get_time(file_list)
    print(len(fc.get_time(file_list)[0]))
    print('Here is your average time:')  
    if (len(result[0])!=0):
        print(str(sum(result[0])/len(result[0])/60) + ' minute')

```
# Request in Spider

```python
import requests
class TiebaSpider:
    def __init__(self, tieba_name):
        self.tieba_name = tieba_name
        self.url_temp = "https://tieba.baidu.com/f?kw="+tieba_name+"&ie=utf-8&pn={}"
        self.headers = {"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36"}
    def get_url_list(self):
        url_list = []
        for i in range(1000):
            url_list.append(self.url_temp.format(i*50))
        return url_list
#         return [self.url_temp.format(i * 50) for i in range(1000)]
    def parse_url(self, url):
        print(url)
        response = requests.get(url, headers = self.headers)
        return response.content.decode()
    def save_html(self, html_str, page_num):
        file_path = "{}-{}page.html".format(self.tieba_name, page_num)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_str)
    def run(self):
        url_list = self.get_url_list()
        for url in url_list:
            html_str = self.parse_url(url)
            page_num = url_list.index(url) + 1
            self.save_html(html_str, page_num)
if __name__ == '__main__':
    tieba_spider = TiebaSpider("李毅")
    tieba_spider.run()
```

```sas
proc dts
```

