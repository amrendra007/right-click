// todo improve validation here, add msg to user
const timeSpan = document.getElementById('timeSpan');

//  function to set min on date tag
(function() {
    const d = new Date();
    const day = d.getDate().toString().length === 1 ? `0${d.getDate()}` : d.getDate();
    const month = (d.getMonth() + 1).toString().length === 1 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
    const min = `${d.getFullYear()}-${month}-${day}`;
    timeSpan.min = min;
}());
