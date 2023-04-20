from bs4 import BeautifulSoup
import requests
import pandas as pd

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36'}

def extract_anchor_tags(html_table):
    anchor_tags = [f"https://www.bahnstatistik.de/{a['href']}" for a in html_table.find_all('a')]
    return anchor_tags

def parse_table(table):
    rows = table.find_all('tr')
    data = []
    for idx, row in enumerate(rows):
        cols = row.find_all('td')
        if cols:
            key = cols[0].text.strip()
            value = cols[1].text.strip()
            data.append((key,value))
    return data

response = requests.get("https://www.bahnstatistik.de/BfVerzS.htm", headers=headers)

html_table = BeautifulSoup(response.text, 'html.parser').find_all("table")[1]
anchor_tag_links = extract_anchor_tags(html_table)
print(anchor_tag_links)


def req_hook(response):
    soup = BeautifulSoup(response.text, 'html.parser')
    tups = parse_table(soup.find_all("table")[2])
    print(tups)
    return tups

all_tups = []

for url in anchor_tag_links:

    response = requests.get(url, headers=headers)

    all_tups += req_hook(response=response)
    

df_codes = pd.DataFrame(all_tups)
df_codes.to_json("./dbCodes.json")
print(df_codes)
