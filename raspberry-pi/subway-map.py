import gpiozero as gp
import requests
from time import sleep

led = gp.LED(25)

def get_mari_train_time():
    r = requests.get('https://train-times-mta.herokuapp.com/mari-train-time')
    print(r.text)

def get_train_times(line, station, direction):
    url = 'https://train-times-mta.herokuapp.com/next-train-times/%s/%s/%s' % (line,station,direction) 
    r = requests.get(url)
    print(r.text)

def get_all_stops():
    print('Start get_all_stops')


def get_all_train_times():
    print('Start get_all_train_times')

def test_light():
    while True:
        led.on()
        sleep(1)
        led.off()
        sleep(1)

get_mari_train_time()
get_train_times('A', 'A46', 'N')
test_light()