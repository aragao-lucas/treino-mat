        i = 0
        score = 0;
        while (i < 10){        
        
        let choice1 = Math.floor(Math.random()*1001);
        let choice2 = Math.floor(Math.random()*1001);
        result = prompt("quanto é " + choice1 + " - " + choice2 + "?");
        if (result == choice1 - choice2) {
            alert("parabéns, você acertou!");
            score ++;
            document.getElementById("item2").innerHTML = "Pontuação: " + score;
        } else {
            alert("que pena, você errou! a resposta correta é " + (choice1 - choice2));
        }
        i ++;
    }