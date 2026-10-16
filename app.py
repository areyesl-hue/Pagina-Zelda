from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def inicio():
    return render_template("index.html")
@app.route("/link")
def link():
    return render_template("link.html")


@app.route("/zelda")
def zelda():
    return render_template("zelda.html")


@app.route("/ganondorf")
def ganondorf():
    return render_template("ganondorf.html")


@app.route("/espada")
def espada():
    return render_template("espada.html")


if __name__ == "__main__":
    app.run(debug=True)