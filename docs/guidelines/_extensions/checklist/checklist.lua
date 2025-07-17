-- Interactive Checklist Extension for Quarto
-- Converts special markdown syntax to interactive checkboxes

function Div(el)
  if el.classes:includes("checklist") then
    local checklist_id = el.attributes.id or "checklist-" .. math.random(1000, 9999)
    local title = el.attributes.title or "Checklist"
    
    -- Extract checklist items from the div content
    local items = {}
    for i, item in ipairs(el.content) do
      if item.t == "Para" or item.t == "Plain" then
        local text = pandoc.utils.stringify(item)
        if text:match("^%s*%-%s*%[%s*%]") then
          -- This is a checklist item
          local item_text = text:gsub("^%s*%-%s*%[%s*%]%s*", "")
          table.insert(items, item_text)
        end
      end
    end
    
    -- Generate HTML for interactive checklist
    local html_items = {}
    for i, item in ipairs(items) do
      table.insert(html_items, string.format(
        '<div class="checklist-item"><input type="checkbox" id="%s-item-%d" class="checklist-checkbox"><label for="%s-item-%d">%s</label></div>',
        checklist_id, i, checklist_id, i, item
      ))
    end
    
    local html = string.format([[
<div class="interactive-checklist" id="%s">
  <div class="checklist-header">
    <h4>%s</h4>
    <button class="checklist-reset" onclick="resetChecklist('%s')">Reset</button>
  </div>
  <div class="checklist-items">
    %s
  </div>
  <div class="checklist-progress">
    <div class="progress-bar">
      <div class="progress-fill" id="%s-progress"></div>
    </div>
    <span class="progress-text" id="%s-text">0/%d completed</span>
  </div>
</div>
]], checklist_id, title, checklist_id, table.concat(html_items, "\n    "), checklist_id, checklist_id, #items)
    
    return pandoc.RawBlock("html", html)
  end
end

function Shortcode(el)
  if el.name == "checklist" then
    local id = el.args.id or "checklist-" .. math.random(1000, 9999)
    local title = el.args.title or "Checklist"
    local items = {}
    
    -- Parse items from shortcode content
    if el.args.items then
      for item in el.args.items:gmatch("[^;]+") do
        table.insert(items, item:gsub("^%s*(.-)%s*$", "%1"))
      end
    end
    
    -- Generate HTML
    local html_items = {}
    for i, item in ipairs(items) do
      table.insert(html_items, string.format(
        '<div class="checklist-item"><input type="checkbox" id="%s-item-%d" class="checklist-checkbox"><label for="%s-item-%d">%s</label></div>',
        id, i, id, i, item
      ))
    end
    
    local html = string.format([[
<div class="interactive-checklist" id="%s">
  <div class="checklist-header">
    <h4>%s</h4>
    <button class="checklist-reset" onclick="resetChecklist('%s')">Reset</button>
  </div>
  <div class="checklist-items">
    %s
  </div>
  <div class="checklist-progress">
    <div class="progress-bar">
      <div class="progress-fill" id="%s-progress"></div>
    </div>
    <span class="progress-text" id="%s-text">0/%d completed</span>
  </div>
</div>
]], id, title, id, table.concat(html_items, "\n    "), id, id, #items)
    
    return pandoc.RawBlock("html", html)
  end
end