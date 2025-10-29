// drive the page: populate list of names, let user add new names (or merge), invoke draw-random and render result

import {
  buildDrawImpl,
  deleteNames,
  draw,
  mergeNames,
  registerNewNames,
  updateStatePostDraw,
  type DrawImpl,
} from "./draw-random";
import { read, write } from "./local-storage-sync";
import { deserialize, serialize, type State } from "./serialize";

function writeStateToStore(state: State) {
  console.log("Saving state", state);
  write(serialize(state));
}
function readStateFromStore(): State {
  const state = deserialize(read());
  console.log("Loading state", state);
  return state;
}

class UiState extends EventTarget {
  constructor(private state: State) {
    super();
    this.impl = buildDrawImpl();
    this.initial_state = { ...state };
    this.selection = new Set();
  }

  public toggleSelected(name: string, selected: boolean) {
    if (selected) {
      this.selection.add(name);
    } else {
      this.selection.delete(name);
    }

    this.dispatchEvent(
      new CustomEvent("selectionChanged", {
        detail: { selection: new Set(this.selection) },
      })
    );
  }

  public updateSelection(selection: HTMLCollectionOf<HTMLOptionElement>) {
    this.selection = new Set(
      Array.from(selection).map((option) => option.textContent)
    );
  }

  public registerNewName(name: string) {
    registerNewNames(this.impl, this.state, new Set([name]));
    writeStateToStore(this.state);
  }

  public currentState(): State {
    return { ...this.state };
  }

  public currentSelection(): Set<string> {
    return new Set(this.selection);
  }

  public execute(): string {
    const winner = draw(this.impl, this.state, this.selection);
    updateStatePostDraw(this.impl, this.state, this.selection, winner);
    writeStateToStore(this.state);
    return winner;
  }

  public reset(state: State) {
    if (state !== this.state) {
      this.state = { ...state };
    }
    this.selection = new Set();
    writeStateToStore(this.state);
  }

  public merge(merge_names: Set<string>, new_name: string) {
    mergeNames(this.state, merge_names, new_name);
    this.reset(this.state);
  }

  public deleteSelected() {
    deleteNames(this.state, this.selection);
    this.reset(this.state);
  }

  public rollback() {
    writeStateToStore(this.initial_state);
    this.state = { ...this.initial_state };
    console.log("rolling back", this.initial_state);
  }

  private impl: DrawImpl;
  private readonly initial_state: State;
  private selection: Set<string>;
}

// setup state
const init_state = readStateFromStore();
const ui_state = new UiState(init_state);

// grab html elements
function htmlElement<T>(id: string) {
  return document.getElementById(id) as T;
}
// todo const names_list = htmlElement<HTMLSelectElement>("select_names");
const add_name_field = htmlElement<HTMLInputElement>("name_to_add");
const choose_button = htmlElement<HTMLButtonElement>("choose_button");
const merge_button = htmlElement<HTMLButtonElement>("merge_button");
const delete_button = htmlElement<HTMLButtonElement>("delete_button");
const rollback_button = htmlElement<HTMLButtonElement>("rollback_button");
const result_label = htmlElement<HTMLHeadingElement>("result");
const merge_container = htmlElement<HTMLDivElement>("merge-details-container");
const list_container = htmlElement<HTMLDivElement>("list-container");

// logic
function getCheckboxes() {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>("#list-container label input")
  );
}
function addNewName(name: string) {
  if (name.trim().length === 0) {
    return;
  }

  if (getCheckboxes().some((cb) => cb.value === name)) {
    return;
  }

  const span = document.createElement("span");
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = name;
  span.textContent = name;
  label.appendChild(checkbox);
  label.appendChild(span);
  list_container.appendChild(label);

  checkbox.addEventListener("change", () => {
    ui_state.toggleSelected(name, checkbox.checked);
  });
}

function repopulateList(state: State) {
  list_container.replaceChildren();
  for (const key of Object.keys(state)) {
    addNewName(key);
  }
}

function showMergeUi() {
  const names_to_merge = ui_state.currentSelection();

  const merge_instructions = document.createElement("label");
  const merge_select = document.createElement("select");
  const merge_confirm = document.createElement("input");
  merge_instructions.textContent = "Select new name";
  merge_confirm.type = "button";
  merge_confirm.value = "Confirm Merge";

  // set up triggers and such
  merge_select.addEventListener("change", () => {
    merge_confirm.disabled = merge_select.selectedOptions.length !== 1;
  });
  merge_confirm.addEventListener("click", () => {
    const merge_name = merge_select.value;
    ui_state.merge(names_to_merge, merge_name);
    merge_container.style.visibility = "hidden";
    repopulateList(ui_state.currentState());
  });

  for (const name of names_to_merge) {
    const option = document.createElement("option");
    option.textContent = name;
    merge_select.appendChild(option);
  }
  merge_instructions.appendChild(merge_select);
  merge_container.replaceChildren(merge_instructions, merge_confirm);
  merge_container.style.visibility = "visible";
}

function updateCosmeticButtonStates() {
  ui_state.addEventListener("selectionChanged", (evt) => {
    const selection = (evt as CustomEvent).detail.selection;
    choose_button.disabled = selection.size < 2;
    merge_button.disabled = selection.size < 2;
    delete_button.disabled = selection.size < 1;
    merge_container.style.visibility = "hidden";
  });

  const selection = ui_state.currentSelection();
  choose_button.disabled = selection.size < 2;
  merge_button.disabled = selection.size < 2;
  delete_button.disabled = selection.size < 1;
  merge_container.style.visibility = "hidden";
}

function connectHandlers(ui_state: UiState) {
  add_name_field.addEventListener("keyup", (evt) => {
    if (evt.key === "Enter") {
      addNewName(add_name_field.value);
      ui_state.registerNewName(add_name_field.value);
      add_name_field.value = "";
      evt.preventDefault();
    }
  });

  choose_button.addEventListener("click", () => {
    const winner = ui_state.execute();
    result_label.textContent = winner;
  });

  rollback_button.addEventListener("click", () => {
    ui_state.rollback();
  });

  merge_button.addEventListener("click", () => {
    showMergeUi();
  });
  delete_button.addEventListener("click", () => {
    if (
      confirm(
        `Are you sure you want to delete these:\n${[
          ...ui_state.currentSelection(),
        ].join("\n")}`
      )
    )
      ui_state.deleteSelected();
    repopulateList(ui_state.currentState());
  });
}

// run
repopulateList(init_state);
connectHandlers(ui_state);
updateCosmeticButtonStates();
