# Zugscheisser

This Python code retrieves the timetable for a given train station from the Deutsche Bahn API and then calculates the time difference between the scheduled arrival and departure times for each train, sorting the results by the largest difference. This can be useful for finding trains that are currently waiting in a station, allowing you to easily locate a train with an available toilet.

## Getting Started

You can install the necessary libraries using `pip`, like so:
```
pip install requests pandas
```
You will also need to set up an API key from Deutsche Bahn, which you can obtain from the [DB API Marketplace](https://developer.deutschebahn.com/store/).

## Usage

1. Clone or download this repository to your computer.
2. Open `db.py` in a Python IDE or text editor.
3. Enter your API key in the `headers` dictionary, where it says `'DB-Api-Key': "YOUR_API_KEY_HERE"`.
4. Set the `search_pattern` variable to the station code for the desired train station, without any spaces or special characters.
5. Run the script. It will retrieve the timetable data for the station and output a table of trains sorted by the largest time difference between scheduled arrival and departure times.

## License

This code is released under the MIT License. See `LICENSE` for more information.