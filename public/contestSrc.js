// todo improve validation here, add msg to user
const submitBtn = document.getElementById('submitBtn');
const timeSpan = document.getElementById('timeSpan');
const correctTimeError = document.getElementById('correctTimeError');

//  function to set min on date tag
(function() {
    const d = new Date();
    const day = d.getDate().toString().length === 1 ? `0${d.getDate()}` : d.getDate();
    const month = (d.getMonth() + 1).toString().length === 1 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
    const min = `${d.getFullYear()}-${month}-${day}`;
    timeSpan.min = min;
}());

function handleSubmit() {
    const contestName = document.getElementById('contestName').value;
    const description = document.getElementById('description').value;
    const hrs = document.getElementById('hrs').value;
    const min = document.getElementById('min').value;

    let [yy, mm, dd] = timeSpan.value.split('-'); // eslint-disable-line prefer-const
    mm -= 1;
    const milliSecond = new Date(yy, mm, dd, hrs, min, 0).getTime() - Date.now();
    if (milliSecond < 0) {
        correctTimeError.textContent = 'Enter valid time';
        return;
    }

    fetch('/contest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contestName,
            description,
            milliSecond,
        }),
    });
}

submitBtn.addEventListener('click', handleSubmit);
