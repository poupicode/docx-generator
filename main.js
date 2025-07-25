import { createReport } from 'https://unpkg.com/docx-templates/lib/browser.js';

class DocxGenerator {
  constructor() {
    this.templateFile = null;      // Pour les templates locaux
    this.templateData = null;      // Pour les templates distants
    this.jsonData = null;
    this.templates = [];           // Liste des templates distants
    this.initializeApp();
  }

  initializeApp() {
    this.loadTemplatesList();
    this.setupTemplateSelection();
    this.setupFileInput();
    this.setupJsonEditor();
    this.setupGenerateButton();
    this.loadDefaultData();
  }

  async loadTemplatesList() {
    try {
      const response = await fetch('https://poupicode.github.io/template-library/templates.json');
      this.templates = await response.json();
      this.populateTemplateSelect();
    } catch (error) {
      console.warn('Impossible de charger les templates distants:', error);
      this.setupFallbackMode();
    }
  }

  populateTemplateSelect() {
    const select = document.getElementById('templateSelect');
    select.innerHTML = '<option value="">Choisissez un template...</option>';
    
    // Ajouter les templates distants
    this.templates.forEach((template, index) => {
      const option = document.createElement('option');
      option.value = `remote_${index}`;
      option.textContent = template.description;
      select.appendChild(option);
    });
    
    // Ajouter l'option upload local
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = '📁 Upload mon template local';
    select.appendChild(customOption);
  }

  setupFallbackMode() {
    const select = document.getElementById('templateSelect');
    select.innerHTML = '<option value="custom">📁 Upload votre template local</option>';
    select.value = 'custom';
    document.getElementById('customUpload').style.display = 'block';
  }

  setupTemplateSelection() {
    const select = document.getElementById('templateSelect');
    const customUpload = document.getElementById('customUpload');
    
    select.addEventListener('change', async (e) => {
      const value = e.target.value;
      
      // Reset des templates précédents
      this.templateFile = null;
      this.templateData = null;
      this.hideTemplateStatus();
      
      if (value === 'custom') {
        // Afficher l'upload local
        customUpload.style.display = 'block';
      } else if (value.startsWith('remote_')) {
        // Charger template distant
        customUpload.style.display = 'none';
        const index = parseInt(value.replace('remote_', ''));
        await this.loadRemoteTemplate(this.templates[index]);
      } else {
        // Rien sélectionné
        customUpload.style.display = 'none';
      }
    });
  }

  async loadRemoteTemplate(template) {
    this.showTemplateStatus('⏳ Téléchargement du template...', '#4facfe');
    
    try {
      const response = await fetch(template.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.templateData = await response.arrayBuffer();
      this.showTemplateStatus(`✅ ${template.description} chargé`, '#48bb78');
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      this.showTemplateStatus('❌ Erreur de téléchargement du template', '#f56565');
      this.templateData = null;
    }
  }

  showTemplateStatus(message, color) {
    const status = document.getElementById('templateStatus');
    status.innerHTML = message;
    status.style.color = color;
    status.style.backgroundColor = color + '20';
    status.style.display = 'block';
  }

  hideTemplateStatus() {
    document.getElementById('templateStatus').style.display = 'none';
  }

  setupFileInput() {
    const fileInput = document.getElementById('docxTemplate');
    const displayArea = document.getElementById('templateDisplay');

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) {
        this.templateFile = file;
        this.templateData = null; // Reset template distant
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
      const response = await fetch('./data.json');
      const defaultData = await response.json();
      
      const jsonTextarea = document.getElementById('jsonData');
      jsonTextarea.value = JSON.stringify(defaultData, null, 2);
      this.jsonData = defaultData;
      jsonTextarea.style.borderColor = '#48bb78';
    } catch (error) {
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
    // Vérifier qu'on a un template (local OU distant)
    if (!this.templateFile && !this.templateData) {
      alert('Merci de sélectionner un template');
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
      let template;
      if (this.templateFile) {
        // Template local
        template = await this.readFileAsArrayBuffer(this.templateFile);
      } else {
        // Template distant (déjà en ArrayBuffer)
        template = this.templateData;
      }
      
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
