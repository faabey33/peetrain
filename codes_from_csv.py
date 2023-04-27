import pandas as pd 

df = pd.read_csv("DBSuS-Uebersicht_Bahnhoefe-Stand2019-03.csv", sep=";", encoding="utf-8")
print(f"==>> df: {df}")

df_reduced = df[["Bf DS 100 Abk.", "Station"]]

df_reduced.columns = ["0", "1"]

df_reduced.set_index("0", inplace=True)
df.sort_index(inplace=True)

print(df_reduced)

df_reduced.to_json("./dbCodes_filtered.json", orient="table", force_ascii=False)
