from os import system
import json

def bootstrap():
    f = open("software-config.json")
    commands = json.load(f)

    
    f.close()

if __name__ == "__main__":
    bootstrap()