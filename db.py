import http.client
import requests
import pandas as pd
from datetime import datetime
from xmlConverter import ElementTree, XmlDictConfig, XmlListConfig


conn = http.client.HTTPSConnection("apis.deutschebahn.com")

headers = {
    'DB-Client-Id': "aa3ec39feec75de5dc8c2f3cca743fc8",
    'DB-Api-Key': "b2003130c891c5bc9f10801efe94044b",
    'accept': "application/xml"
    }

nowtime = datetime.now()

#BERLIN CENTRAL STATION
search_pattern = "BLS" #fragile --> no space no special chars
# evaNo=8006713
date=f"{nowtime.year-2000}{nowtime.month:02}{nowtime.day}"
hour=nowtime.hour

### Station Request ###
conn.request("GET", f"/db-api-marketplace/apis/timetables/v1/station/{search_pattern}", headers=headers)
res = conn.getresponse()
data = res.read()
root = ElementTree.XML(data.decode("utf-8"))
station_info_dict = XmlDictConfig(root)

print(station_info_dict)
#evaNo represents Station ID
evaNo = station_info_dict["station"]["eva"]

### Timetable Request ###
conn.request("GET", f"https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1/plan/{evaNo}/{date}/{hour}", headers=headers)
res = conn.getresponse()
data = res.read()
root = ElementTree.XML(data.decode("utf-8"))
timetable_dict = XmlListConfig(root)
print(timetable_dict)

df_raw=pd.DataFrame(timetable_dict)
df = df_raw.dropna(how="any")

# convert nested dict to flat table
ar_df = pd.json_normalize(df['ar']) # arrival
dp_df = pd.json_normalize(df['dp']) # departure
tl_df = pd.json_normalize(df['tl']) # extra info

df=ar_df.join(dp_df, how="outer", lsuffix="_ar", rsuffix="_dp")
df["pt_ar"] = pd.to_datetime("20"+df["pt_ar"], format='%Y%m%d%H%M')
df["pt_dp"] = pd.to_datetime("20"+df["pt_dp"], format='%Y%m%d%H%M')
df=df.join(tl_df, how="outer", rsuffix="_tl")
df["delta_minutes"] = (df["pt_dp"]-df["pt_ar"]).astype('timedelta64[m]')

res_df = df[["c", "n", "pp_ar", "pt_ar", "delta_minutes"]].sort_values("delta_minutes", ascending=False)

print(res_df)


