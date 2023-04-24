import pandas as pd 

df = pd.read_csv("./dbCodes.csv")
print(f"==>> df: {df}")
del df["index"]
df["0"] = df["0"].str.replace('\s+',' ')
df["1"] = df["1"].str.replace('\s+',' ')
df.dropna(inplace=True)
df.drop_duplicates(inplace=True)
df=df.set_index("0")
print(f"==>> df: {df}")
df.to_json("./dbCodes_filtered.json", orient="table", force_ascii=False)
