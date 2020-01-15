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

# Data Cleansing and Customer Segmentation on SAS

```sas
libname test odbc user=financial password=financial dsn=financial; 

/******************* 1 ***********************/

ods html;
ods listing;

libname p1 "/folders/myfolders/CustomerData";  /* Load Data Folder */

/* Option */

option fmtsearch=(p1.myfmts,work.formats);
options fmterr;
option symbolgen mlogic mprint;

/***************homephone and ssn cleansing macro*******************/
%macro cleansing(type);
   %if &type=homephone %then %do;
    phcheck=prxparse('/\(\d{3}\)\d{3}-\d{4}/');
    if homephone eq " " then put _n_"is blank";
    else if prxmatch(phcheck,homephone)=0 then do;
    put _n_ homephone "is updated";
    s=strip(compress(homephone,"()- "));
    ss="(" || substr(s,1,3)|| ")" || substr(s,4,3) || "-" || substr(s,7,4);  
    homephone=ss;
    put homephone;
    end;
    drop s ss phcheck;
   %end;
   %else %if &type=ssn %then %do;
    ssncheck=prxparse('/\d{3}-\d{2}-\d{4}/');
    if ssn eq " " then put _n_"is blank";
    else if prxmatch(ssncheck,ssn)=0 then do;
    put _n_ ssn "will be updated";
    s=strip(compress(ssn,"- ()"));
    ss=substr(s,1,3)|| "-" || substr(s,4,2) || "-" || substr(s,6,4);  
    ssn=ss;
    put ssn;
    end;
    drop s ss ssncheck;
   %end;
%mend;

/*clean homephone and ssn for data sets:
customer
demograph
fico_score
credit_history
address*/

data p1.customer_clean;
set p1.customer;
%cleansing(ssn);
last_update_dt=datetime();
run;
data p1.demograph_clean;
set p1.demograph;
%cleansing(ssn);
last_update_dt=datetime();
run;
data p1.fico_score_clean;
set p1.fico_score;
%cleansing(ssn);
last_update_dt=datetime();
run;
data p1.credit_history_clean;
set p1.credit_history;
%cleansing(ssn);
run;
data p1.address_clean;
set p1.address;
%cleansing(ssn);
%cleansing(homephone);
last_update_dt=datetime();
run;

/* Scrubbing to customer_clean (Customer), demograph_clean(Demograph) fico_score_clean(fico_score) 
and address_clean(address)*/

proc sort data=p1.customer_clean;
by ssn descending last_update_dt;run;
proc sort data=p1.customer_clean nodupkey;
by ssn;run;

proc sort data=p1.demograph_clean;
by ssn descending last_update_dt;run;
/* proc print data=p1.demograph_clean; */
/* where ssn="764-84-6035" or */
/*       ssn="764-85-6402" or */
/*       ssn="415-66-1212"; */
/* run; 
 there are two suspecious records for "415-66-1212" whose format is corrected*/
proc sort data=p1.demograph_clean nodupkey;
by ssn;run;

proc sort data=p1.fico_score_clean;
by ssn descending last_update_dt;run;
proc sort data=p1.fico_score_clean nodupkey;
by ssn;run;

proc sort data=p1.address_clean;
by ssn descending last_update_dt;run;
proc sort data=p1.address_clean nodupkey;
by ssn;run;

/* DATA CLEANSING */
/* USE Proc univariate and freq check data status, there is no abnormal data to
   credit_history,customer and fico_score datasets*/

/* Check Demograph Age/Gender/Nbrchildren/Haschildren and other variables */

proc univariate data=p1.demograph_clean;
var birthdate;
run;
proc freq data=p1.demograph_clean1;
table gender;
run;
proc freq data=p1.demograph_clean1;
table Nbrchildren Haschildren;
run;

/* Clean Demograph data */
data p1.demograph_clean1;
  set p1.demograph_clean;
if birthdate<-60000 then birthdate=birthdate+365.25*200;
if gender="f" or gender="x" then gender = "Female";
if gender="m" or gender="y" then gender = "Male";
if Nbrchildren=. then Nbrchildren=0;
if haschildren=. then haschildren=0;
last_update_dt=datetime();
run;

/*Check Missing Address:no missing address */

proc freq data=p1.address_clean nlevels;
table state / nocum nopercent;
run;

/*Check Missing State/city: All value-missing observations
  have state value as DE and city as Oxford*/
proc print data=p1.address_clean;
where state=" ";
run;

proc print data=p1.address_clean;
where city=" ";
run;

data p1.address_clean1;
  set p1.address_clean;
  if state=" " then state="DE";
  if city=" " then city="Oxford";
  Last_Update_DT=datetime();
run;

/* creat format for fico_range */
proc format library=p1.MyFmts;
value fico_range  . = "Null or Zero"
                  1-630 = "<630"
                  630-649 = "630-649"
                  650-669 = "650-669"
                  670-689 = "670-689"
                  690-709 = "690-709"
                  710-729 = "710-729"
                  730-749 = "730-749"
                  750-769 = "750-769"
                  770-789 = "770-789"
                  790-809 = "790-809"
                  810-high = "810+";
run;  

/*proc sql*/

proc sql;
create table p1.pre_task as
select c.cust_id,
       c.ssn,
       d.birthdate,
       (today()-d.birthdate)/365.25 as Age format=3.,
       d.gender,
       d.maritalstatus,
       s.fico_score,
       s.fico_score as fico_range format=fico_range.,
       d.homeowner,
       d.hasloan,
       d.hasaccounts,
       h.defaulttype,
       d.nbraccounts,
       d.balancesum,
       d.loanbal,
       d.savingsaccount,
       d.currjob,
       d.hhincome,
       d.HasChildren,
       d.NbrChildren,
       d.HasInvest,
       d.FundsBal
from p1.customer_clean as c,
     p1.demograph_clean1 as d,
     p1.fico_score_clean as s,
     p1.credit_history_clean as h
where c.ssn=d.ssn and
      d.ssn=s.ssn and
      s.ssn=h.ssn;
quit;

proc sort data=p1.pre_task;
   by ssn descending defaulttype;
run;

data p1.pre_task1 (drop=defaulttype);
   set p1.pre_task;
  by cust_id descending defaulttype;
  if first.defaulttype then do;
     NbrDefault=0;
  end;
  NbrDefault+1;
  if last.cust_id;
run;

proc sort data=p1.address_clean1;
by ssn;
run;

data p1.task1;
  merge p1.address_clean1(in=a drop=state city address zip)
        p1.pre_task1(in=b);
  by ssn;  
  if b=1; 
  if a=0 then HasAddr=0;
  else HasAddr=1;
  if homephone=" " then HasPhone=0;
  else HasPhone=1;
  last_update_dt=datetime();
run;

/******************* 2 ***********************/

/* Generate pre_task2 with column segment_cd from task1 */
data p1.pre_task2;
  merge p1.address_clean1(in=a)
        p1.pre_task1(in=b);
  by ssn;  
  if b=1; 
  if a=0 then HasAddr=0;
  else HasAddr=1;
  if homephone=" " then HasPhone=0;
  else HasPhone=1;
  last_update_dt=datetime();
 if fico_score>=810 AND 30<Age<40 AND NbrDefault<=2 then Segment_cd="A001";
 if 710<=fico_score<810 AND 30<Age<40 AND NbrDefault<=2 then Segment_cd="A002";
 if 690<=fico_score<710 AND 30<Age<40 AND NbrDefault<=2 then Segment_cd="B001";
 if 650<=fico_score<690 AND 30<Age<40 AND NbrDefault<=2	then Segment_cd="B002";
run;

/* Generate campaign mapping matrix table p1.offer*/
proc sql;
create table p1.Offer as
select s.segment_cd,
       s.segment_desc,
       c.prod_cd,
       p.prod_desc
from p1.segment as s,
     p1.campaign_matrix as c,
     p1.product as p
where s.segment_cd=c.segment_cd and
      c.prod_cd=p.prod_cd;
quit;


/* Sort and Merge */
proc sort data=p1.pre_task2;
by descending segment_cd;
run;
proc sort data=p1.offer;
by descending segment_cd;
run;

data p1.task2;
  merge p1.pre_task2 (in=a)
        p1.offer (in=b); 
  by descending segment_cd;
  if a=1 and b=1;
  last_update_dt=datetime();
run;

/* Split ramdomly to 3 data sets with 33.3% observations */
data p1.samp;
   set p1.task2;
   random=ranuni(0);
run;
proc sort data=p1.samp;
by random;
run; 
data p1.sample1 p1.sample2 p1.sample3;
  set p1.samp (drop=random);
if mod(_n_,3)=0 then output p1.sample1;
else if mod(_n_,3)=1 then output p1.sample2;
else output p1.sample3;
run;
```

