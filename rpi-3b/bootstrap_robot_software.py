import subprocess
import json

def bootstrap():

    f = open("software-config.json")
    commands = json.load(f)

    subprocess.Popen('sudo -S' , shell=True,stdout=subprocess.PIPE)
    subprocess.Popen(commands["sudo_password"], shell=True,stdout=subprocess.PIPE)

    node_path = commands["nodejs_path"]

    for node_app in commands["node_apps"]:
        subprocess.call([node_path, node_app])

    for cmd in commands["bootstrap_execute"]:
        subprocess.call([cmd])

    f.close()

if __name__ == "__main__":
    bootstrap()