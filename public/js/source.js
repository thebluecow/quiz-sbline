(function () {

	let questions = [];
	let shuffled = [];
	let total_questions = 0;
	let correct = 0;
	let incorrect = 0;
	let streak = 0;
	let score = 0;
	let q_answer = 0;
	let answered = 0;
	let max = 0;
	let time_limit = 0;

	// TODO LIST
		// client side logging with game scores. Some sort of encryption (Mongo?)
		// Game score reporting
		// identify user from log in

	// define html input field actions here

	$( "#file" ).change( () => {
	  $('#messages').html('');

	  let files = $('#file');
	  let file = files[0].files[0];

	  let reader = new FileReader();
      reader.readAsText(file, "UTF-8");

      reader.onload = function (evt) {

        questions = _buildQFile(evt.target.result);
        if (questions === 0) {
        	_clearMessages();
        	let message = '<h4>Hmmmm, we couldn\'t read your file for some reason</h4>';
        	message += '<h5>Did you select the correct question file?</h5>';

        	$('#messages').append(message);
        } else {
        	_buildMainHTML();
        }
      }

      reader.onerror = function (evt) {
        console.log("error reading file");
      }
	});

	$( "#quiz-button").click( () => {
		$('#quiz-button').hide();
		$('#reset-button').hide();
		$('#optional').hide();
		$('#messages').html('');
		_startGame();
	});

	$( "#reset-button").click( () => {
		$('#quiz-button').hide();
		$('#reset-button').hide();
		$('#optional').show();
		clearInputs();
		$('#messages').html('');
	});

	$( "#answer-question").click( () => {
		answered++;
		$( "#current-answers option:selected" ).val() === q_answer ? correct++ : incorrect++;

		if (shuffled.length > 0) {
			_updateScore(true);
			_displayQuestion();
		} else {
			_endGame(true);
		}
	});

	// define interal functions here

	let clearInputs = ( () => {
		let input = $('#file');
    	input.replaceWith(input.val('').clone(true));
    	$('#max').val('');
    	$('#time').val('');
	});

	let _endGame = ( clean => {
		_clearMessages();

		let gameOver = '<h3>Great game! Seriously! You really showed us something!</h3>';

		if (!clean) {
			gameOver = '<h3>You ran out of time! So sorry! Want to try again?</h3>';
		}
		$('#messages').append(gameOver);

		_updateScore(false);
		_postScore();

		$('#q').hide();
		$('#quiz-button').show();
		$('#reset-button').show();
	});

	let _clearMessages = ( () => {
		$('#messages').html('');
	})

	let _updateScore = ( clear => {
		let status = 'current';
		if (clear) {
			_clearMessages();
		} else {
			status = 'final';
		}

		let update = '<h4>Your ' + status + ' score:</h4><ul>';
		update += '<h5>Total Answered: '  + answered 		+ '</h5>';
		update += '<h5>Total Correct: '   + correct 		+ '</h5>';
		update += '<h5>Total Incorrect: ' + incorrect 		+ '</h5>';
		update += '<h5>Total Questions: ' + total_questions + '</h5>';
		let game_score = Math.floor((correct / total_questions) * 100);
		if (status === 'final') {
			update += '<h5>Game Score: ' + game_score + '%</h5>';
			$('#messages').append(update);
		} else {
			let cur_q = Number(answered) + 1;
			update = '<h4>You\'re on question ' + cur_q + ' of ' + total_questions + '.</h4>';
			$('#messages').append(update);
		}

	}); 

	let _startGame = (() => {
		_initializeGame();
		let new_max = $('#max').val();
		let new_time = $('#time').val();

		if (new_max !== '' && new_max <= questions.length) {
			max = new_max;
		}

		if (new_time !== '') {
			// convert to milliseconds
			time_limit = new_time * 1000;
		}

		if (max > 0) {
			total_questions = max;
			shuffled = _shuffle(questions).slice(0, max);
		} else {
			total_questions = questions.length;
			shuffled = _shuffle(questions);
		}

		if (time_limit > 1000) {
			setTimeout(_endGame, time_limit);
		}
		_displayQuestion();
	});

	let _postScore = ( () => {

        $.ajax({
		  url: '/game',
		  type: 'POST',
		  data: { totalQuestions: total_questions, answered: answered, correct: correct, incorrect: incorrect }
		});
	});

	let _displayQuestion = (() => {
		let current;
		let question = '<p>';
		let answer = '<label for="current-answers">Select your answer: </label>';
		let id = 1;

		$('#question').html('');
		$('#answers').html('');

		if (shuffled.length > 0) {
			current = shuffled.shift();
		}

		//build questions
		current.question.map(line => question += line + ' ');
		question += '</p>';

		answer += '<select class="form-control" id="current-answers">';
		current.answers.map(line => answer += '<option value="' + id++ + '">' + line + '</option>');
		answer += '</select>';

		q_answer = current.answer;

		$('#question').append(question);
		$('#answers').append(answer);

		$('#q').show();
	});

	let _buildQFile = ( file => {
		let questions = [];
		let status = '';

		if (file != null) {
			// create question object
			let question = null;

			const allLines = file.split(/\r\n|\n/);
			let regex = /^\s*\S+(\s?\S)*\s*$/;

			if (!$.inArray('@Q', allLines)) {
				return 0;
			}
        	// Reading line by line
        	try {
	        	allLines.map((line) => {
	        		if (regex.test(line) && !line.startsWith('*')) {
	        			let truncated = line.substring(0, 75);
	        			if (truncated.startsWith('@Q')) {
	            			question = _createQuestion();
	            			question.status = 'question';
	            		} else if (truncated.startsWith('@A')) {
	            			question.status = 'answer';
	            		} else if (truncated.startsWith('@E')) {
	            			question.status = 'end';
	            			questions.push(question);
	            		} else if (question.status === 'question') {
	            			if (question.question.length < 10) {
	            				question.question.push(truncated);
	            			}
	            		} else if (question.status === 'answer') {
	            			if (question.answer === 0) {
	            				question.answer = truncated;
	            			} else {
	            				if (question.answers.length < 10) {
	            					question.answers.push(truncated);
	            				}
							}
	            		}
	        		}
	        	});
	        } catch (error) {
	        	return 0;
	        }
		}
		return questions;
	});

	let _createQuestion = ( () => {
		let question = {
				status : 'new',
				question : [],
				answers : [],
				answer : 0
		};
		return question;
	});

	let _shuffle = ( array => {
  		let currentIndex = array.length;
  		let temporaryValue;
  		let randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

		    // Pick a remaining element...
		    randomIndex = Math.floor(Math.random() * currentIndex);
		    currentIndex -= 1;

		    // And swap it with the current element.
		    temporaryValue = array[currentIndex];
		    array[currentIndex] = array[randomIndex];
		    array[randomIndex] = temporaryValue;
		}

		return array;
	});

	let _buildMainHTML = (() => {
		let new_div = '<div id="success">';
		new_div += '<h4>Great news! Your file uploaded successfully!</h4>';
		new_div += '<h5>We found ' + questions.length + ' questions. Would you like to start your quiz?</h5>';
		new_div += '</div>';
		$('#messages').append(new_div);
		$('#quiz-button').show();
		//$('#choose-file').hide();
	});
	
	let _initializeGame = (() => {
		total_questions = questions.length;
		correct = 0;
		incorrect = 0;
		steak = 0;
		score = 0;
		answered = 0;
	});

	$('#q').hide();
	$('#quiz-button').hide();
	$('#reset-button').hide();
	$('#optional').show();

}());