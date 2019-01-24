const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();
var data = null;

xhr.withCredentials = true;

describe('mari-train-time', () => {
  test('returns a valid train time', (done) => {
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        let trainTime = parseInt(this.responseText);
        expect(trainTime).toBeGreaterThan(0);
        done();
      }
    });

    xhr.open("GET", "http://localhost:3000/mari-train-time");
    xhr.setRequestHeader("cache-control", "no-cache");

    xhr.send(data);
  })
})

