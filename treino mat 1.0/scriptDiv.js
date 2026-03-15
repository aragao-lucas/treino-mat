        i = 0
        score = 0;
        while (i < 10){        
        
        let options = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let choice1 = options[Math.floor(Math.random()*options.length)];
        let choice2 = options[Math.floor(Math.random()*options.length)];
        result = prompt("quanto é " + choice1 + " / " + choice2 + "?");
        if (result == choice1 / choice2) {
            alert("parabéns, você acertou!");
            score ++;
            document.getElementById("item2").innerHTML = "Pontuação: " + score;
        } else {
            alert("que pena, você errou! a resposta correta é " + (choice1 / choice2));
        }
        i ++;
    }