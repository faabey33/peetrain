# -*- coding: utf-8 -*-
import aiohttp
import requests
import asyncio
import pandas as pd
from bs4 import BeautifulSoup

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                         'Chrome/102.0.0.0 Safari/537.36'}


def extract_anchor_tags(html_table):
    anchor_tags = [f"https://www.bahnstatistik.de/{a['href']}" for a in html_table.find_all('a')]
    return anchor_tags


def parse_table(table, idx):
    rows = table.find_all('tr')
    data = []
    for row in rows:
        cols = row.find_all('td')
        if cols:
            key = cols[0].text.strip()
            value = cols[1].text.strip()
            if idx == 4:
                key = cols[1].text.strip()
                value = cols[2].text.strip()

            data.append((key, value))
    return data


async def fetch(session, url, headers):
    async with session.get(url, headers=headers) as response:
        return await response.text()


async def req_hook(session, url, headers):
    response_text = await fetch(session, url, headers)
    soup = BeautifulSoup(response_text, 'html.parser')
    idx = 2 if url != "https://www.bahnstatistik.de/BfVerzA.htm" else 4
    tups = parse_table(soup.find_all("table")[idx], idx)
    print(tups)
    return tups


async def main():
    response = requests.get('https://www.bahnstatistik.de/BfVerzS.htm', headers=headers)
    html_table = BeautifulSoup(response.text, 'html.parser').find_all("table")[1]
    anchor_tag_links = extract_anchor_tags(html_table)

    all_tups = []
    async with aiohttp.ClientSession() as session:
        tasks = [asyncio.ensure_future(req_hook(session, url, headers)) for url in anchor_tag_links]
        responses = await asyncio.gather(*tasks)
        for response in responses:
            all_tups += response

    df_codes = pd.DataFrame(all_tups)
    df_codes.to_json("./dbCodes.json", orient="table", force_ascii=False)
    df_codes.to_csv("./dbCodes.csv")
    print(df_codes)


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())

