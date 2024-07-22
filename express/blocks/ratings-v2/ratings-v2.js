

function loadTemplate(callback) { 
    fetch(window.location.origin + '/express/blocks/ratings-v2/template.html')
        .then(response => response.text())
        .then(html => {
            console.log(html)
            callback(html);
        })
        .catch(error => console.error('Error loading template:', error));
}

export default function decorate (block) {
    loadTemplate(function(template) {
        console.log(template)
        block.innerHTML = '';
        block.innerHTML = template;
    });


}