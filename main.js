import { createReport } from 'https://unpkg.com/docx-templates/lib/browser.js';

class DocxGenerator {
  constructor() {
    this.templateFile = null;
    this.jsonData = null;
    this.initializeApp();
  }

  initializeApp() {
    this.setupFileInput();
    this.setupJsonEditor();
    this.setupGenerateButton();
    this.loadDefaultData();
  }

  setupFileInput() {
    const fileInput = document.getElementById('docxTemplate');
    const displayArea = document.getElementById('templateDisplay');

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) {
        this.templateFile = file;
        displayArea.innerHTML = `
          <div style="color: #48bb78;">✅ ${file.name}</div>
          <small style="color: #718096; margin-top: 10px; display: block;">
            Taille: ${this.formatFileSize(file.size)}
          </small>
        `;
        displayArea.classList.add('has-file');
      }
    });

    // Drag and drop
    displayArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      displayArea.style.borderColor = '#4facfe';
      displayArea.style.background = '#f0f9ff';
    });

    displayArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      displayArea.style.borderColor = '#cbd5e0';
      displayArea.style.background = '';
    });

    displayArea.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.docx')) {
          fileInput.files = files;
          fileInput.dispatchEvent(new Event('change'));
        } else {
          alert('Veuillez sélectionner un fichier .docx');
        }
      }
      displayArea.style.borderColor = '#cbd5e0';
      displayArea.style.background = '';
    });
  }

  setupJsonEditor() {
    const jsonTextarea = document.getElementById('jsonData');
    
    jsonTextarea.addEventListener('input', () => {
      try {
        this.jsonData = JSON.parse(jsonTextarea.value);
        jsonTextarea.style.borderColor = '#48bb78';
      } catch (error) {
        jsonTextarea.style.borderColor = '#f56565';
      }
    });
  }

  setupGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', () => {
      this.generateReport();
    });
  }

  async loadDefaultData() {
    try {
      // Essaie de charger le fichier data.json
      const response = await fetch('./data.json');
      const defaultData = await response.json();
      
      const jsonTextarea = document.getElementById('jsonData');
      jsonTextarea.value = JSON.stringify(defaultData, null, 2);
      this.jsonData = defaultData;
      jsonTextarea.style.borderColor = '#48bb78';
    } catch (error) {
      // Si le fichier n'existe pas, utilise les données hardcodées
      console.warn('Impossible de charger data.json, utilisation des données par défaut');
      const defaultData = {
        "consultation": {
          "roomName": "Salle-Consultation-001",
          "date": "2025-07-21",
          "time": "14:30",
          "connectionStatus": "Connecté"
        },
        "doctor": {
          "firstName": "Marie",
          "name": "Dubois",
          "occupation": "Cardiologue"
        },
        "patient": {
          "firstName": "Jean",
          "name": "Martin",
          "birthDate": "1980-05-15",
          "gender": "Masculin",
          "patientNumber": "PAT-2025-0123",
          "consultationReason": "Contrôle de routine cardiaque"
        },
        "measures": {
          "tensiometre": [
            {
              "systolique": "120 mmHg",
              "diastolique": "80 mmHg",
              "frequence": "72 bpm",
              "heure": "14:35"
            }
          ],
          "oxymetre": [
            {
              "saturation": "98%",
              "frequence": "74 bpm",
              "heure": "14:37"
            }
          ],
          "thermometre": [
            {
              "temperature": "36.8°C",
              "heure": "14:38"
            }
          ]
        },
        "generation": {
          "date": "2025-07-21",
          "time": "15:00"
        }
      };

      const jsonTextarea = document.getElementById('jsonData');
      jsonTextarea.value = JSON.stringify(defaultData, null, 2);
      this.jsonData = defaultData;
      jsonTextarea.style.borderColor = '#48bb78';
    }
  }

  async generateReport() {
    if (!this.templateFile) {
      alert('Merci de sélectionner un template DOCX');
      return;
    }

    if (!this.jsonData) {
      alert('Merci de fournir des données JSON valides');
      return;
    }

    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '⏳ Génération en cours...';

    try {
      const template = await this.readFileAsArrayBuffer(this.templateFile);
      
      const report = await createReport({
        template: new Uint8Array(template),
        data: this.jsonData,
        noSandbox: true,
        cmdDelimiter: ['{', '}'],
      });

      const blob = new Blob([report], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      this.downloadFile(blob, 'rapport.docx');
      
      generateBtn.innerHTML = '✅ Rapport généré !';
      setTimeout(() => {
        generateBtn.innerHTML = '🚀 Générer le rapport';
        generateBtn.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération du rapport. Vérifiez le template et les données.');
      generateBtn.innerHTML = '🚀 Générer le rapport';
      generateBtn.disabled = false;
    }
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(file);
    });
  }

  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DocxGenerator();
});
