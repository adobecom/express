import { getIconElement } from "../../scripts/utils.js";
import { getLottie } from "../../scripts/utils.js";

const OFFSET_HEIGHT = 1000
const MEDIAN_HEIGHT = 1300
const FINAL_TOP_VALUE = 40

function addSectionIDs (block) {
    let i = 1;
    for (let section of Array.from(document.querySelectorAll(".section"))){
        
        section.setAttribute('id',`section${i}`) 
        i += 1
    }
}

function removeButtonStyles (block) {
    for (let button of Array.from(block.querySelectorAll('a'))){
        button.classList.remove('button')
        button.classList.remove('accent')
    }
}

function decorateHeader (block) {
    const header = Array.from(block.querySelectorAll(":scope > div "))[0]
    const icon=  getIconElement('arrow-right')
    header.prepend(icon)
    header.classList.add('header')

}

export default function decorate(block) {

    function checkScroll() {
        const diff = MEDIAN_HEIGHT - OFFSET_HEIGHT
        const scrollPosition = window.pageYOffset; 
        if (scrollPosition >= MEDIAN_HEIGHT) {
            block.style.top = FINAL_TOP_VALUE + "%"
        }  else  if (scrollPosition   >= OFFSET_HEIGHT) {

            let top = FINAL_TOP_VALUE + 50 * ((MEDIAN_HEIGHT - scrollPosition ) / diff)
            block.style = "display:visible"
            block.style.top = top + "%"
        } else { 
            block.style.display = 'none';
        }
    }

    // Add scroll event listener
    window.addEventListener('scroll', checkScroll);

    // Initial check
    checkScroll();
    addSectionIDs(block)
    removeButtonStyles(block)
    decorateHeader(block) 
}